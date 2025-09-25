plugins {
    application
    kotlin("jvm") version "1.9.24"
}

repositories {
    mavenCentral()
}

application {
    mainClass.set("io.ktor.server.netty.EngineMain")
}

dependencies {
    implementation("io.ktor:ktor-server-netty:2.3.12")
    implementation("io.ktor:ktor-server-core:2.3.12")
    implementation("io.ktor:ktor-server-content-negotiation:2.3.12")
    implementation("io.ktor:ktor-serialization-jackson:2.3.12")
    implementation("io.ktor:ktor-server-cors:2.3.12")
    implementation("io.ktor:ktor-server-call-logging:2.3.12")
    implementation("ch.qos.logback:logback-classic:1.4.14")

    // HTTP client for AI providers if needed
    implementation("io.ktor:ktor-client-core:2.3.12")
    implementation("io.ktor:ktor-client-java:2.3.12")
    implementation("io.ktor:ktor-client-content-negotiation:2.3.12")
    implementation("io.ktor:ktor-serialization-jackson:2.3.12")

    // PDF and CSV
    implementation("com.itextpdf:itext7-core:7.2.5")
    implementation("org.apache.commons:commons-csv:1.10.0")

    // Gmail SMTP
    implementation("com.sun.mail:jakarta.mail:2.0.1")
    implementation("jakarta.activation:jakarta.activation-api:2.1.2")

    // Env
    implementation("io.github.cdimascio:dotenv-kotlin:6.4.1")
}

kotlin {
    jvmToolchain(17)
}
