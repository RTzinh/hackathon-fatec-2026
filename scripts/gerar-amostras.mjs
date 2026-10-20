// Gera PDFs mínimos para testar a checagem do protótipo. Os arquivos com XMP declaram PDF/A-2B,
// mas não são PDF/A conformes de verdade: servem só para demonstrar a leitura dos metadados.
import { mkdirSync, writeFileSync } from 'node:fs'

function pdf(text, withPdfa) {
  const xmp = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/" pdfaid:part="2" pdfaid:conformance="B"/></rdf:RDF></x:xmpmeta><?xpacket end="w"?>`
  const content = `BT /F1 14 Tf 60 760 Td (${text}) Tj ET`
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R${withPdfa ? ' /Metadata 6 0 R' : ''} >>`,
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ...(withPdfa ? [`<< /Type /Metadata /Subtype /XML /Length ${xmp.length} >>\nstream\n${xmp}\nendstream`] : []),
  ]
  let body = '%PDF-1.7\n'
  const offsets = objects.map((object, index) => { const offset = body.length; body += `${index + 1} 0 obj\n${object}\nendobj\n`; return offset })
  const xref = body.length
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}`
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return body
}

const dir = new URL('../public/amostras/', import.meta.url)
mkdirSync(dir, { recursive: true })
const base = 'dsm_2026_2_davirocha_paineldeindicadoresparacooperativas'
writeFileSync(new URL(`${base}.pdf`, dir), pdf('Versao final - amostra SIG-Banca (ficticia)', true), 'latin1')
writeFileSync(new URL(`${base}_TA.pdf`, dir), pdf('Termo de Autorizacao - amostra SIG-Banca (ficticia)', true), 'latin1')
writeFileSync(new URL('termo-sem-pdfa.pdf', dir), pdf('PDF comum, sem declaracao PDF/A', false), 'latin1')
console.log('Amostras geradas em public/amostras/')
