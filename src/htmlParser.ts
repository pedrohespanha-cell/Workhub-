import { Production } from './types';

export const parseHTMLText = (htmlString: string): Production[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const newProds: Production[] = [];

  // Parse Current Productions
  const items = doc.querySelectorAll('.item');
  items.forEach(item => {
    const titleEl = item.querySelector('.current-production-title a') as HTMLElement;
    if (!titleEl) return;
    const name = titleEl.innerText.trim();

    let company = '';
    let prodEmail = '';
    let payroll = '';
    let dates = '';
    let tier = '';
    let address = '';
    let phone = '';
    let contractLink = '';
    let callSheetLink = '';
    
    const tableTop = item.querySelector('.table-headertop-content');
    if (tableTop) {
      const tds = tableTop.querySelectorAll('td');
      if (tds[0]) company = tds[0].innerText.trim();
      
      const mailto = tableTop.querySelector('a[href^="mailto:"]') as HTMLAnchorElement;
      if (mailto && !mailto.innerText.toLowerCase().includes('payroll')) {
        prodEmail = mailto.innerText.trim();
      }

      // Links scraping
      const links = item.querySelectorAll('a');
      links.forEach(l => {
        const t = l.innerText.toLowerCase();
        if (t.includes('contract')) contractLink = l.href;
        if (t.includes('call sheet')) callSheetLink = l.href;
      });

      // Address & Phone scraping
      const text = tableTop.textContent || '';
      const phoneMatch = text.match(/(\d{3}[-.\s]\d{3}[-.\s]\d{4})/);
      if (phoneMatch) phone = phoneMatch[0];

      // Robust address regex looking for typical Canadian/US formats
      const addrMatch = text.match(/\d+\s+[A-Za-z0-9\s.,]+,\s*[A-Za-z\s.,]+,\s*[A-Z]{2}\s+[A-Z0-9\s-]{3,7}/i);
      if (addrMatch) {
        address = addrMatch[0].trim();
      } else {
        // Fallback: look for postal code and backtrack
        const postalMatch = text.match(/([A-Z]\d[A-Z]\s?\d[A-Z]\d)/i);
        if (postalMatch && postalMatch.index) {
          const beforePostal = text.substring(0, postalMatch.index);
          const lines = beforePostal.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          if (lines.length > 0) {
            // Try to grab the last 2-3 lines before the postal code
            const addrLines = lines.slice(Math.max(0, lines.length - 3)).join(', ');
            address = `${addrLines}, ${postalMatch[0]}`;
          }
        }
      }
    }

    const emailEl = item.querySelector('p[style*="color:green"]') as HTMLElement;
    if (emailEl) payroll = emailEl.innerText.replace('Payroll email:', '').trim();

    const crew: Record<string, string> = {};
    const bottomDiv = item.querySelector('.current-production-bottom');
    
    if (bottomDiv) {
      bottomDiv.querySelectorAll('tr').forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 2) {
          const role = cols[0].innerText.trim();
          const person = cols[1].innerText.trim().replace(/\s+/g, ' ');
          if (person !== 'N/A' && person !== '' && person !== 'Various') crew[role] = person;
        }
      });
    }

    const rightDiv = item.querySelector('.current-production-right');
    if(rightDiv) {
      const tdElements = rightDiv.querySelectorAll('td');
      tdElements.forEach(td => {
        if(td.innerHTML.includes('<time')) {
          const times = td.querySelectorAll('time');
          if(times.length >= 2) dates = `${times[0].innerText} to ${times[1].innerText}`;
        }
        if(td.innerText.includes('(Daily Seniority)') || td.innerText.includes('Supplemental TV') || td.innerText.includes('Tier')) {
          tier = td.innerText.trim();
        }
      });
    }

    newProds.push({ 
      id: crypto.randomUUID(), 
      name, 
      company, 
      prodEmail, 
      payroll, 
      crew, 
      dates, 
      tier, 
      address,
      phone,
      contractLink,
      callSheetLink,
      status: name.startsWith('WRAPPED') ? 'Wrapped' : 'Active' 
    });
  });

  // Parse Rumoured Productions
  const allElements = Array.from(doc.querySelectorAll('*'));
  const rumouredHeader = allElements.find(el => el.textContent?.includes('UPCOMING / RUMOURED PRODUCTIONS') && el.children.length === 0);
  
  if (rumouredHeader) {
    let curr = rumouredHeader.nextElementSibling || rumouredHeader.parentElement?.nextElementSibling;
    while (curr) {
      const text = (curr as HTMLElement).innerText?.trim() || '';
      if (text && !text.includes('---') && text.length > 5) {
        const splitIdx = text.lastIndexOf(' - ');
        const name = splitIdx > -1 ? text.substring(0, splitIdx).trim() : text;
        const dates = splitIdx > -1 ? text.substring(splitIdx + 3).trim() : 'TBA';
        newProds.push({ 
          id: crypto.randomUUID(), 
          name: name, 
          company: '', 
          prodEmail: '', 
          payroll: '', 
          crew: {}, 
          dates, 
          tier: 'Rumoured', 
          address: '',
          phone: '',
          contractLink: '',
          callSheetLink: '',
          status: 'Rumoured' 
        });
      }
      curr = curr.nextElementSibling;
    }
  }

  return newProds;
};
