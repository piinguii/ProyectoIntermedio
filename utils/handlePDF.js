const handlePinata = require('./handlePinata');
const PDFDocument = require('pdfkit');
const { Readable } = require('stream');

const generateDeliveryNotePDF = (deliveryNoteData) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const chunks = [];
        
        doc.on('data', (chunk) => {
            chunks.push(chunk);
        });
        
        doc.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
        });
        
        doc.on('error', reject);
        
        console.log(deliveryNoteData);
        
        // Encabezado
        doc
          .fontSize(20)
          .text('Gabrisp', 50, 50)
          .fontSize(10)
          .text(deliveryNoteData.user.name || deliveryNoteData.user.email || 'Usuario', 50, 75)
          .text(deliveryNoteData.user.nif || 'N/A', 50, 90)
          .text(deliveryNoteData.user.address?.postal ? deliveryNoteData.user.address.postal : '', 50, 120)
          .text(deliveryNoteData.user.email ? deliveryNoteData.user.email : '', 50, 135);
        
        // Datos del cliente
        doc
          .fontSize(12)
          .text('ALBARÁN', 400, 50)
          .fontSize(10)
          .text('Facturar a:', 400, 75)
          .text(deliveryNoteData.client.name, 400, 90)
          .text(deliveryNoteData.client.address.province + ', ' + deliveryNoteData.client.address.city + ', ' + deliveryNoteData.client.address.postal, 400, 120)
          .text(deliveryNoteData.client.nif || 'N/A', 400, 135);
        
        // Detalles del albarán
        doc
          .fontSize(10)
          .text(`Fecha del albarán: ${deliveryNoteData.workdate.toLocaleDateString()}`, 50, 180)
          .text(`Código proyecto cliente: ${deliveryNoteData.projectId}`, 50, 195);
        
        // Tabla de trabajos
        doc
          .fontSize(10)
          .text('NOMBRE DEL TRABAJADOR', 50, 230)
          .text('DESCRIPCIÓN DEL TRABAJO', 200, 230)
          .text(deliveryNoteData.format === 'hours' ? 'HORAS' : 'MATERIALES', 380, 230)
          .moveTo(50, 245)
          .lineTo(550, 245)
          .stroke();
        
        // Fila del trabajo
        doc
          .text(deliveryNoteData.user.name || deliveryNoteData.user.email || 'Usuario', 50, 260)
          .text(deliveryNoteData.description, 200, 260)
          .text( deliveryNoteData.format === 'hours' ? `${deliveryNoteData.hours}` : `${deliveryNoteData.material}`, 380, 260)  // No hay horas

          // Observaciones y firma
        doc
          .moveDown()
          .fontSize(10)
          .text('Observaciones', 50, 320)
          .text('FIRMADO', 110, 340);
        
        doc
          .moveDown()
          .text('Albarán firmado y elaborado con Gabrisp, aplicación especializada en la firma digital de albaranes. Muchas gracias.', 50, 380, {
            width: 500,
            align: 'justify'
          });
        
        // Finalizar documento
        doc.end();
    });
}

// funcion para generar el pdf de la nota de entrega
const handlePDF = async (deliveryNote) => {
    try {
        
        const user = deliveryNote.user;
        const client = deliveryNote.clientId;
        const project = deliveryNote.projectId;
       console.log("deliveryNote", user, client, project);
        
        const pdfData = {
            user,
            client,
            projectId: project.code,
            workdate: deliveryNote.workdate,
            description: deliveryNote.description,
            format: deliveryNote.format,
            hours: deliveryNote.hours,
            material: deliveryNote.material,
            signed: deliveryNote.signed
        };

        console.log("pdfData", pdfData);
        // Generate PDF
        const pdfBuffer = await generateDeliveryNotePDF(pdfData);
        
        // Upload to Pinata
        const uploadResult = await handlePinata.uploadFile(pdfBuffer, `${deliveryNote._id}.pdf`);

        if (!uploadResult.success) {
            throw new Error('Failed to upload PDF to Pinata');
        }

        return {
            success: true,
            pdfUrl: uploadResult.url,
            ipfsHash: uploadResult.ipfsHash
        };

    } catch (error) {
        console.error('Error handling PDF:', error);
        return {
            success: false,
            error: 'Failed to handle PDF'
        };
    }
};

module.exports = handlePDF; 