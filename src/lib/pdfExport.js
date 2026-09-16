import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const DESKTOP_WIDTH = 1024; // matches the statement's max-w-5xl content width; activates md: breakpoints

function waitForImages(container) {
  const imgs = Array.from(container.querySelectorAll("img"));
  return Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          })
    )
  );
}

async function withDesktopClone(container, capture) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.left = "-99999px";
  iframe.style.top = "0";
  iframe.style.width = `${DESKTOP_WIDTH}px`;
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.background = "#ffffff";
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    doc.open();
    doc.write("<!DOCTYPE html><html><head></head><body></body></html>");
    doc.close();

    // Carry over the parent document's styles so Tailwind classes resolve inside the iframe
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      doc.head.appendChild(node.cloneNode(true));
    });

    const clone = container.cloneNode(true);
    clone.style.width = "100%";
    doc.body.appendChild(clone);

    // Size the iframe to its content so layout completes
    iframe.style.height = `${clone.scrollHeight}px`;
    await waitForImages(clone);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    await capture(doc);
  } finally {
    document.body.removeChild(iframe);
  }
}

export async function exportStatementPDF(container, retailerId, lang) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const imgWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;

  await withDesktopClone(container, async (doc) => {
    const sections = Array.from(doc.querySelectorAll("[data-pdf-section]"));
    let first = true;

    for (const section of sections) {
      const canvas = await html2canvas(section, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        windowWidth: DESKTOP_WIDTH,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (!first) pdf.addPage();
      first = false;

      if (imgHeight <= usableHeight) {
        pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);
      } else {
        let heightLeft = imgHeight;
        let position = margin;
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= usableHeight;
        while (heightLeft > 0) {
          pdf.addPage();
          position = margin - (imgHeight - heightLeft);
          pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
          heightLeft -= usableHeight;
        }
      }
    }
  });

  // Page numbers
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `${lang === "it" ? "Pagina" : "Page"} ${i} / ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 4
    );
  }

  const safeId = (retailerId || "retailer").replace(/[^a-zA-Z0-9-_~]/g, "");
  const filename =
    lang === "it"
      ? `Estratto_Incentivi_Rivenditore_${safeId}_IT.pdf`
      : `Retailer_Incentive_Statement_${safeId}_EN.pdf`;
  pdf.save(filename);
}