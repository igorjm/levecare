package care.leve.patients.service;

import care.leve.patients.model.Patient;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PrescriptionServiceTest {

    private final PrescriptionService service = new PrescriptionService();

    @Test
    void issuesDemoPrescriptionPdfWithComplianceDisclaimers() throws IOException {
        Patient patient = new Patient("p-1", "Maria Silva", "maria@example.com", Instant.now());

        var prescription = service.issue(patient);

        assertNotNull(prescription.id());
        assertEquals("p-1", prescription.patientId());
        assertTrue(prescription.pdf().length > 0);

        try (PDDocument document = Loader.loadPDF(prescription.pdf())) {
            String text = new PDFTextStripper().getText(document);
            assertTrue(text.contains("DEMONSTRACAO"), "must be watermarked as a demo");
            assertTrue(text.contains("Maria Silva"));
            assertTrue(text.contains("ICP-Brasil"), "must mark the qualified-signature placeholder");
            assertTrue(text.contains("SNCR"), "must mark the SNCR integration placeholder");
        }
    }
}
