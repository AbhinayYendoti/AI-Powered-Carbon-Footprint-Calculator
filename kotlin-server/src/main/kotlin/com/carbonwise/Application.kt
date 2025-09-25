package com.carbonwise

import io.ktor.server.application.*
import io.ktor.http.*
import io.ktor.serialization.jackson.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.response.*
import io.ktor.server.request.*
import io.ktor.server.routing.*
import io.github.cdimascio.dotenv.dotenv
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import java.time.Instant
import java.util.UUID
import jakarta.mail.*
import jakarta.mail.internet.InternetAddress
import jakarta.mail.internet.MimeBodyPart
import jakarta.mail.internet.MimeMessage
import jakarta.mail.internet.MimeMultipart
import java.util.Properties
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.Paragraph
import org.apache.commons.csv.CSVFormat
import org.apache.commons.csv.CSVPrinter
import java.io.ByteArrayOutputStream
import io.ktor.client.*
import io.ktor.client.engine.java.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.ContentType
import io.ktor.client.call.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.serialization.jackson.*
import com.fasterxml.jackson.databind.JsonNode

fun main(args: Array<String>): Unit = io.ktor.server.netty.EngineMain.main(args)

fun Application.module() {
    val dotenv = dotenv {
        ignoreIfMissing = true
    }
    val aiProvider = (dotenv["AI_PROVIDER"] ?: "").lowercase()
    val geminiKey = dotenv["GEMINI_API_KEY"]
    val httpClient = HttpClient(Java) {
        install(ContentNegotiation) { jackson() }
    }
    install(CORS) {
        anyHost()
        allowHeader(HttpHeaders.ContentType)
    }
    install(ContentNegotiation) {
        jackson {
            disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
        }
    }

    val sessions = mutableMapOf<String, Map<String, Any>>()

    routing {
        get("/") { call.respondText("Carbon Wise AI Friend Kotlin Server", ContentType.Text.Plain) }

        post("/api/calculate") {
            val body = call.receive<Map<String, Any>>()
            val emissions = calculateEmissions(body)
            val analysis = fallbackAnalysis(emissions)
            val recommendations = fallbackRecommendations(emissions)
            val predictions = predict(emissions["total"] as Int)
            call.respond(mapOf(
                "success" to true,
                "emissions" to emissions,
                "recommendations" to recommendations,
                "analysis" to analysis["analysis"],
                "predictions" to predictions,
                "worldAverage" to 4800,
                "comparison" to ((emissions["total"] as Int) * 100 / 4800)
            ))
        }

        post("/api/chat") {
            val body = call.receive<Map<String, Any?>>()
            val message = body["message"]?.toString() ?: ""
            val system = "You are a friendly, knowledgeable environmental consultant. Provide practical, encouraging advice about reducing carbon footprints. Keep it under 200 words."
            val response = try {
                if (aiProvider == "gemini" && !geminiKey.isNullOrBlank()) {
                    geminiComplete(httpClient, geminiKey, dotenv["GEMINI_MODEL"] ?: "gemini-1.5-flash", "$system\n\nUser: $message")
                } else chatFallback(message)
            } catch (e: Exception) {
                chatFallback(message)
            }
            call.respond(mapOf(
                "success" to true,
                "response" to response,
                "timestamp" to Instant.now().toString()
            ))
        }

        post("/api/save-session") {
            val body = call.receive<Map<String, Any>>()
            val sessionId = UUID.randomUUID().toString()
            sessions[sessionId] = body
            call.respond(mapOf("success" to true, "sessionId" to sessionId))
        }

        get("/api/session/{id}") {
            val id = call.parameters["id"]
            val session = sessions[id]
            if (session == null) {
                call.respond(HttpStatusCode.NotFound, mapOf("success" to false, "message" to "Session not found"))
            } else {
                call.respond(mapOf("success" to true, "session" to session))
            }
        }

        get("/api/actionplan/{userId}") {
            val userId = call.parameters["userId"] ?: "user"
            val sample = mapOf(
                "transport" to mapOf("carKm" to 8000, "publicKm" to 2000, "planeHours" to 10),
                "home" to mapOf("electricity" to 5000, "naturalGas" to 800),
                "diet" to mapOf("dietType" to "mixed", "meatServings" to 5),
                "shopping" to mapOf("clothing" to 500, "electronics" to 300)
            )
            val emissions = calculateEmissions(sample)
            val analysis = fallbackAnalysis(emissions)
            val recs = fallbackRecommendations(emissions)
            call.respond(mapOf(
                "userId" to userId,
                "timestamp" to Instant.now().toString(),
                "emissions" to emissions,
                "analysis" to analysis["analysis"],
                "recommendations" to recs,
                "summary" to mapOf(
                    "totalRecommendations" to recs.size,
                    "potentialReduction" to recs.mapNotNull { (it["impact"] as? Int) }.sum(),
                    "priorityAreas" to recs.take(3).map { it["category"] }
                )
            ))
        }

        get("/api/report/{userid}") {
            val format = call.request.queryParameters["format"] ?: "pdf"
            val report = mapOf(
                "name" to "Sample User",
                "totalEmissions" to 4200,
                "transport" to 1200,
                "home" to 1500,
                "diet" to 1000,
                "shopping" to 500
            )
            if (format == "csv") {
                val out = ByteArrayOutputStream()
                val printer = CSVPrinter(out.writer(), CSVFormat.DEFAULT.withHeader("name","totalEmissions","transport","home","diet","shopping"))
                printer.printRecord(report["name"], report["totalEmissions"], report["transport"], report["home"], report["diet"], report["shopping"])
                printer.flush()
                call.response.header(HttpHeaders.ContentDisposition, "attachment; filename=carbon_report.csv")
                call.respondBytes(out.toByteArray(), ContentType.Text.CSV)
            } else {
                val baos = ByteArrayOutputStream()
                val pdfWriter = PdfWriter(baos)
                val pdf = PdfDocument(pdfWriter)
                val doc = Document(pdf)
                doc.add(Paragraph("Personal Carbon Footprint Report").setBold())
                doc.add(Paragraph("Name: ${report["name"]}"))
                doc.add(Paragraph("Total Emissions: ${report["totalEmissions"]} kg CO₂/year"))
                doc.add(Paragraph("Transport: ${report["transport"]} kg CO₂/year"))
                doc.add(Paragraph("Home: ${report["home"]} kg CO₂/year"))
                doc.add(Paragraph("Diet: ${report["diet"]} kg CO₂/year"))
                doc.add(Paragraph("Shopping: ${report["shopping"]} kg CO₂/year"))
                doc.close()
                call.response.header(HttpHeaders.ContentDisposition, "attachment; filename=carbon_report.pdf")
                call.respondBytes(baos.toByteArray(), ContentType.Application.Pdf)
            }
        }

        post("/api/send-report") {
            data class SendReq(
                val to: String? = null,
                val subject: String? = "Carbon Footprint Report",
                val text: String? = "Please find your report attached.",
                val report: Map<String, Any>? = null,
                val format: String? = "pdf"
            )
            val req = call.receive<SendReq>()
            val user = dotenv["GMAIL_USER"] ?: "yendotiabhi602@gmail.com"
            val pass = dotenv["GMAIL_PASS"] ?: ""
            if (pass.isBlank()) {
                call.respond(HttpStatusCode.BadRequest, mapOf("success" to false, "message" to "Missing GMAIL_PASS"))
                return@post
            }
            val props = Properties().apply {
                put("mail.smtp.auth", "true")
                put("mail.smtp.starttls.enable", "true")
                put("mail.smtp.host", "smtp.gmail.com")
                put("mail.smtp.port", "587")
            }
            val session = Session.getInstance(props, object: Authenticator() {
                override fun getPasswordAuthentication(): PasswordAuthentication = PasswordAuthentication(user, pass)
            })
            val message = MimeMessage(session)
            message.setFrom(InternetAddress(user))
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(req.to ?: user))
            message.subject = req.subject

            val multipart = MimeMultipart()
            val textPart = MimeBodyPart()
            textPart.setText(req.text ?: "")
            multipart.addBodyPart(textPart)

            val format = req.format ?: "pdf"
            if (format == "csv") {
                val out = ByteArrayOutputStream()
                val printer = CSVPrinter(out.writer(), CSVFormat.DEFAULT.withHeader("name","totalEmissions","transport","home","diet","shopping"))
                val r = req.report ?: mapOf("name" to "User", "totalEmissions" to 0, "transport" to 0, "home" to 0, "diet" to 0, "shopping" to 0)
                printer.printRecord(r["name"], r["totalEmissions"], r["transport"], r["home"], r["diet"], r["shopping"])
                printer.flush()
                val attach = MimeBodyPart()
                attach.dataHandler = javax.activation.DataHandler(javax.activation.DataSource { out.toByteArray().inputStream() }, "text/csv")
                attach.fileName = "carbon_report.csv"
                multipart.addBodyPart(attach)
            } else {
                val baos = ByteArrayOutputStream()
                val pdfWriter = PdfWriter(baos)
                val pdf = PdfDocument(pdfWriter)
                val doc = Document(pdf)
                val r = req.report ?: mapOf("name" to "User", "totalEmissions" to 0, "transport" to 0, "home" to 0, "diet" to 0, "shopping" to 0)
                doc.add(Paragraph("Personal Carbon Footprint Report").setBold())
                doc.add(Paragraph("Name: ${r["name"]}"))
                doc.add(Paragraph("Total Emissions: ${r["totalEmissions"]} kg CO₂/year"))
                doc.add(Paragraph("Transport: ${r["transport"]} kg CO₂/year"))
                doc.add(Paragraph("Home: ${r["home"]} kg CO₂/year"))
                doc.add(Paragraph("Diet: ${r["diet"]} kg CO₂/year"))
                doc.add(Paragraph("Shopping: ${r["shopping"]} kg CO₂/year"))
                doc.close()
                val attach = MimeBodyPart()
                attach.dataHandler = javax.activation.DataHandler(javax.activation.DataSource { baos.toByteArray().inputStream() }, "application/pdf")
                attach.fileName = "carbon_report.pdf"
                multipart.addBodyPart(attach)
            }
            message.setContent(multipart)
            Transport.send(message)
            call.respond(mapOf("success" to true))
        }
    }
}

private fun calculateEmissions(userData: Map<String, Any>): Map<String, Int> {
    fun n(path: List<String>): Double = try {
        var cur: Any? = userData
        for (k in path) cur = (cur as Map<*, *>)[k]
        (cur as? Number)?.toDouble() ?: 0.0
    } catch (_: Exception) { 0.0 }

    val car = n(listOf("transport","carKm")) * 0.12
    val publicKm = n(listOf("transport","publicKm")) * 0.03
    val plane = n(listOf("transport","planeHours")) * 90
    val transport = car + publicKm + plane

    val electricity = n(listOf("home","electricity")) * 0.42
    val gas = n(listOf("home","naturalGas")) * 5.3
    val home = electricity + gas

    val dietType = ( (userData["diet"] as? Map<*, *>)?.get("dietType")?.toString() ?: "mixed" )
    val baseDiet = when(dietType){
        "vegan" -> 1.5
        "vegetarian" -> 2.5
        "pescatarian" -> 3.2
        "mixed" -> 4.0
        "high-meat" -> 5.5
        else -> 4.0
    } * 365
    val meatServings = n(listOf("diet","meatServings")) * 52 * 0.5
    val diet = baseDiet + meatServings

    val clothing = n(listOf("shopping","clothing")) * 0.03
    val electronics = n(listOf("shopping","electronics")) * 0.05
    val shopping = clothing + electronics

    val t = (transport + home + diet + shopping).toInt()
    return mapOf(
        "transport" to transport.toInt(),
        "home" to home.toInt(),
        "diet" to diet.toInt(),
        "shopping" to shopping.toInt(),
        "total" to t
    )
}

private fun fallbackRecommendations(emissions: Map<String, Int>): List<Map<String, Any>> {
    val list = mutableListOf<Map<String, Any>>()
    val transport = emissions["transport"] ?: 0
    val home = emissions["home"] ?: 0
    val diet = emissions["diet"] ?: 0
    if (transport > 2000) list += mapOf("category" to "transport", "title" to "Switch to Electric Vehicle", "description" to "EVs can reduce transport emissions by up to 60%.", "impact" to (transport * 0.6).toInt(), "difficulty" to "medium", "timeframe" to "long-term", "cost" to "high")
    if (transport > 1500) list += mapOf("category" to "transport", "title" to "Use Public Transportation", "description" to "Significant reduction by switching commutes.", "impact" to (transport * 0.4).toInt(), "difficulty" to "easy", "timeframe" to "immediate", "cost" to "low")
    if (home > 1500) list += mapOf("category" to "home", "title" to "Switch to Renewable Energy", "description" to "Reduce home emissions dramatically.", "impact" to (home * 0.7).toInt(), "difficulty" to "medium", "timeframe" to "short-term", "cost" to "medium")
    if (diet > 1200) list += mapOf("category" to "diet", "title" to "Reduce Meat Consumption", "description" to "One of the most effective ways to lower footprint.", "impact" to (diet * 0.3).toInt(), "difficulty" to "easy", "timeframe" to "immediate", "cost" to "free")
    return list
}

private fun fallbackAnalysis(emissions: Map<String, Int>): Map<String, Any> {
    val total = emissions["total"] ?: 0
    val assessment = when {
        total < 2000 -> "excellent"
        total < 3000 -> "good"
        total < 4000 -> "average"
        total < 5000 -> "high"
        else -> "very-high"
    }
    val biggest = emissions.filterKeys { it != "total" }.maxByOrNull { it.value }?.key ?: "transport"
    return mapOf(
        "analysis" to mapOf(
            "overallAssessment" to assessment,
            "biggestContributor" to biggest,
            "improvementPotential" to if (total > 4000) "high" else if (total > 3000) "medium" else "low",
            "insights" to listOf(
                "Your carbon footprint is ${if (4800>0) (total * 100 / 4800) else 0}% of the world average",
                "$biggest contributes the most to your emissions",
                if (total > 4000) "There's significant room for improvement" else "You're doing well!"
            ),
            "comparison" to mapOf(
                "worldAverage" to if (4800>0) (total * 100 / 4800) else 0,
                "percentile" to if (total < 2000) "top 20%" else if (total < 3000) "top 40%" else if (total < 4000) "average" else "above average",
                "ranking" to if (total < 3000) "Excellent" else if (total < 4000) "Good" else "Needs improvement"
            )
        )
    )
}

private fun predict(total: Int, months: Int = 12): List<Map<String, Any>> {
    val trend = (-10..10).random() / 100.0
    val monthly = trend / 12
    return (1..months).map { m ->
        val predicted = (total * (1 + monthly * m)).toInt()
        mapOf("month" to m, "predicted" to predicted, "confidence" to maxOf(0.5, 1 - (m * 0.05)))
    }
}

private fun chatFallback(message: String): String {
    val lower = message.lowercase()
    return when {
        lower.contains("what is carbon footprint") -> "A carbon footprint is the total greenhouse gas emissions caused by your activities, measured in CO2e across transport, energy, diet, and consumption."
        lower.contains("reduce") -> "Try public transport, switch to renewable energy, reduce meat, buy secondhand, and use efficient appliances."
        else -> "I'm here to help you understand your carbon footprint and find ways to reduce it. What would you like to know?"
    }
}

private suspend fun geminiComplete(http: HttpClient, apiKey: String, model: String, prompt: String): String {
    // Minimal JSON call to Gemini REST v1beta models:generateContent
    // Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=API_KEY
    val url = "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}"
    val payload = mapOf(
        "contents" to listOf(
            mapOf(
                "parts" to listOf(mapOf("text" to prompt))
            )
        )
    )
    val response: HttpResponse = http.post(url) {
        contentType(ContentType.Application.Json)
        setBody(payload)
    }
    val node: JsonNode = response.body()
    val text = node.path("candidates").firstOrNull()?.path("content")?.path("parts")?.firstOrNull()?.path("text")?.asText()
    return text ?: chatFallback("")
}
