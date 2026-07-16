package care.leve.patients.service;

import care.leve.patients.model.Patient;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.util.UUID;

/**
 * Generates a DEMONSTRATION prescription PDF.
 *
 * A real Brazilian digital prescription requires an ICP-Brasil qualified
 * signature (CFM 2.299/2021), SNCR registration for controlled substances
 * (ANVISA RDC 1.000/2025), and a pharmacy-verifiable QR code. Those
 * integration points are rendered as explicit placeholders.
 */
@Service
public class PrescriptionService {

    public record DemoPrescription(String id, String patientId, Instant issuedAt, byte[] pdf) {
    }

    public DemoPrescription issue(Patient patient) {
        return render(patient, UUID.randomUUID().toString(), Instant.now());
    }

    /**
     * Renders the demo PDF for a given prescription id and issue time. The
     * content is a pure function of (patient, id, issuedAt), which lets a
     * persisted prescription be re-downloaded without storing the PDF.
     */
    public DemoPrescription render(Patient patient, String id, Instant issuedAt) {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            var bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            var regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                float y = 780;
                y = writeLine(content, bold, 20, 50, y, "LeveCare — Receita de DEMONSTRACAO");
                y = writeLine(content, bold, 12, 50, y - 8, "*** SEM VALIDADE MEDICA — PROJETO DE PORTFOLIO ***");
                y = writeLine(content, regular, 11, 50, y - 20, "Documento: " + id);
                y = writeLine(content, regular, 11, 50, y - 4, "Emitido em: " + issuedAt);
                y = writeLine(content, regular, 11, 50, y - 4, "Paciente: " + patient.name() + " (" + patient.id() + ")");
                y = writeLine(content, bold, 12, 50, y - 24, "Prescricao (ficticia):");
                y = writeLine(content, regular, 11, 50, y - 4, "Semaglutida 0,25mg — 1 aplicacao subcutanea semanal (exemplo ilustrativo)");
                y = writeLine(content, bold, 12, 50, y - 32, "[PLACEHOLDER] Assinatura digital ICP-Brasil (NGS2) — CFM 2.299/2021");
                y = writeLine(content, bold, 12, 50, y - 4, "[PLACEHOLDER] Registro SNCR — ANVISA RDC 1.000/2025");
                writeLine(content, bold, 12, 50, y - 4, "[PLACEHOLDER] QR Code de verificacao em farmacia");
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return new DemoPrescription(id, patient.id(), issuedAt, out.toByteArray());
        } catch (IOException e) {
            throw new UncheckedIOException("failed to render demo prescription", e);
        }
    }

    private float writeLine(PDPageContentStream content, PDType1Font font, int size,
                            float x, float y, String text) throws IOException {
        content.beginText();
        content.setFont(font, size);
        content.newLineAtOffset(x, y);
        content.showText(text);
        content.endText();
        return y - size - 4;
    }
}
