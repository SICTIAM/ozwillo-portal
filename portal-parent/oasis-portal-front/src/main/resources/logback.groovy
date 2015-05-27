import ch.qos.logback.classic.encoder.PatternLayoutEncoder
import ch.qos.logback.core.ConsoleAppender

scan()

appender("CONSOLE", ConsoleAppender) {
    encoder(PatternLayoutEncoder) {
        //pattern = "| %-5level| %d{HH:mm:ss.SSS} | %logger{36} - %msg%n"
        pattern = "| %-5level| %d{HH:mm:ss.SSS} | %logger - %msg%n"
    }
}

logger("org.oasis_eu.portal.main", INFO)
logger("org.oasis_eu", INFO)
logger("org.oasis_eu.portal.config.OasisLocaleResolver", INFO)
logger("kernelLogging.logFullErrorResponses", ERROR) // ERROR, WARN, INFO, DEBUG
logger("kernelLogging.logRequestTimings", DEBUG)


root(WARN, ["CONSOLE"])
