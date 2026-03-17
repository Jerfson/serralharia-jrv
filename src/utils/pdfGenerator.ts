import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Client, Material, Quote, QuoteItem } from '../types';

export const generateQuotePDF = (
  quote: Quote,
  client: Client,
  materials: Material[],
  companyData: { name: string; phone: string; email: string; address: string }
) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185); // Blue
  doc.text(companyData.name, 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Endereço: ${companyData.address}`, 14, 30);
  doc.text(`Tel: ${companyData.phone}`, 14, 35);
  doc.text(`Email: ${companyData.email}`, 14, 40);

  // Quote Info
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('ORÇAMENTO', 140, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Nº: ${quote.id.substring(0, 8).toUpperCase()}`, 140, 30);
  doc.text(`Data: ${format(new Date(quote.createdAt), 'dd/MM/yyyy')}`, 140, 35);
  doc.text(`Validade: ${format(new Date(quote.validUntil), 'dd/MM/yyyy')}`, 140, 40);

  // Divider
  doc.setDrawColor(200);
  doc.line(14, 45, 196, 45);

  // Client Info
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Dados do Cliente', 14, 55);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Nome: ${client.name}`, 14, 62);
  let clientInfoY = 67;
  if (client.document) {
    doc.text(`CPF/CNPJ: ${client.document}`, 14, clientInfoY);
    clientInfoY += 5;
  }
  doc.text(`Telefone: ${client.phone}`, 14, clientInfoY);
  clientInfoY += 5;
  if (client.email) {
    doc.text(`Email: ${client.email}`, 14, clientInfoY);
    clientInfoY += 5;
  }
  if (client.address) {
    doc.text(`Endereço: ${client.address}`, 14, clientInfoY);
    clientInfoY += 5;
  }

  // Items Table
  const tableColumn = ["Item", "Qtd", "Un", "V. Unit.", "Total"];
  const tableRows: any[] = [];

  let totalItemsValue = 0;

  quote.items.forEach((item) => {
    const material = materials.find((m) => m.id === item.materialId);
    let finalPrice = 0;
    let unitPrice = 0;

    if (item.unitPrice !== undefined) {
      unitPrice = item.unitPrice;
      finalPrice = unitPrice * item.quantity;
    } else if (material) {
      const materialCost = material.costPrice * item.quantity;
      const lossCost = materialCost * ((item.technicalLossPercentage || 0) / 100);
      const totalCost = materialCost + lossCost + (item.laborCost || 0);
      finalPrice = totalCost * (1 + (item.profitMarginPercentage || 0) / 100);
      unitPrice = finalPrice / item.quantity;
    }

    totalItemsValue += finalPrice;

    const materialName = item.name || material?.name || 'Item Personalizado';
    const rowData = [
      item.observation ? `${materialName}\n(${item.observation})` : materialName,
      item.quantity.toString(),
      material?.unit || 'un',
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unitPrice),
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalPrice),
    ];
    tableRows.push(rowData);
  });

  autoTable(doc, {
    startY: clientInfoY + 5,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10 },
  });

  // Total
  const finalY = (doc as any).lastAutoTable.finalY || 85;
  let currentTotalY = finalY + 15;

  if ((quote.laborValue && quote.laborValue > 0) || (quote.laborPercentage && quote.laborPercentage > 0)) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Custo Total (Materiais):', 130, currentTotalY);
    doc.text(
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalItemsValue),
      196,
      currentTotalY,
      { align: 'right' }
    );
    currentTotalY += 7;

    const laborLabel = quote.laborType === 'fixed' 
      ? 'Mão de Obra (Valor Fixo):' 
      : `Mão de Obra (${quote.laborValue || quote.laborPercentage}% sobre o custo):`;
    
    const laborAmount = quote.laborType === 'fixed'
      ? (quote.laborValue || 0)
      : totalItemsValue * ((quote.laborValue || quote.laborPercentage || 0) / 100);

    doc.text(laborLabel, 130, currentTotalY);
    doc.text(
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(laborAmount),
      196,
      currentTotalY,
      { align: 'right' }
    );
    currentTotalY += 7;
  }

  if (quote.discountValue !== undefined && quote.discountValue > 0) {
    doc.setFontSize(10);
    doc.setTextColor(231, 76, 60); // Red
    const discountLabel = quote.discountType === 'percentage' 
      ? `Desconto (${quote.discountValue}%):` 
      : 'Desconto (Valor Fixo):';
    
    doc.text(discountLabel, 130, currentTotalY);
    doc.text(
      `- ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.discountAmount || 0)}`,
      196,
      currentTotalY,
      { align: 'right' }
    );
    currentTotalY += 10;
  } else if (currentTotalY === finalY + 15 + 7) {
    // If labor was added but no discount, add extra space before total
    currentTotalY += 3;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Valor Total:', 130, currentTotalY);
  
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185);
  doc.text(
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.totalValue),
    196,
    currentTotalY,
    { align: 'right' }
  );

  // Conditions & Observations
  let currentY = currentTotalY + 15;
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Condições e Observações', 14, currentY);
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setTextColor(100);
  
  if (quote.deliveryTime) {
    doc.text(`Prazo de Entrega: ${quote.deliveryTime}`, 14, currentY);
    currentY += 6;
  }
  
  if (quote.downPayment !== undefined && quote.downPayment > 0) {
    doc.text(`Valor da Entrada: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.downPayment)}`, 14, currentY);
    currentY += 6;
  }
  
  if (quote.observations) {
    doc.text(`Observações:`, 14, currentY);
    currentY += 6;
    
    // Split text to fit page width
    const splitObs = doc.splitTextToSize(quote.observations, 180);
    doc.text(splitObs, 14, currentY);
    currentY += (splitObs.length * 5);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150);
  const validityDays = Math.round((new Date(quote.validUntil).getTime() - new Date(quote.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  doc.text(`Este orçamento é válido por ${validityDays} dias a partir da data de emissão.`, 14, 280);
  doc.text('Valores sujeitos a alteração sem aviso prévio após o vencimento.', 14, 285);

  return doc;
};
