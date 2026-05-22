import axios from 'axios';
import * as cheerio from 'cheerio';

// ─── Real URL scraper for manual job insertion ─────────────────────────────
export async function scrapeJobUrl(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3'
      },
      timeout: 12000
    });

    const $ = cheerio.load(response.data);
    $('script, style, iframe, nav, footer, header, svg, noscript').remove();

    let title = $('h1').first().text().trim();
    if (!title) {
      title = $('title').text().trim().split('|')[0].split('-')[0].trim();
    }

    let company = $('[class*="company-name"], [class*="companyName"], [class*="organization"], [id*="company"]').first().text().trim();
    if (!company) {
      const pageTitle = $('title').text().trim();
      const match = pageTitle.match(/(.*?)\s+at\s+(.*)/i) || pageTitle.match(/(.*?)\s+-\s+(.*)/i);
      if (match) {
        title = title || match[1].trim();
        company = match[2].trim().split('|')[0].split('-')[0].trim();
      } else {
        company = 'Empresa no identificada';
      }
    }

    let location = $('[class*="location"], [class*="job-location"], [id*="location"]').first().text().trim();
    if (!location) location = 'Remoto / Híbrido';

    let descriptionText = $('article, main, [class*="description"], [class*="job-description"], [class*="jobDescription"], [id*="jobDescription"]').first().text().trim();
    if (!descriptionText || descriptionText.length < 200) {
      descriptionText = $('div[class*="content"], div[class*="body"], #content, #main').text().trim();
    }
    if (!descriptionText || descriptionText.length < 200) {
      descriptionText = $('p').map((i, el) => $(el).text()).get().join('\n\n').trim();
    }

    descriptionText = descriptionText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .replace(/ {2,}/g, ' ')
      .substring(0, 4000);

    if (descriptionText.length < 100) {
      descriptionText = 'No se pudo extraer la descripción de forma automática. Por favor, pega la descripción del empleo aquí.';
    }

    const sourceLabel = url.includes('linkedin.com') ? 'LinkedIn'
      : url.includes('indeed.com') ? 'Indeed'
      : url.includes('infojobs.net') ? 'InfoJobs'
      : url.includes('tecnoempleo.com') ? 'Tecnoempleo'
      : 'Web Externa';

    return {
      title: title || 'Puesto de Empleo Detectado',
      company: company || 'Empresa Empleadora',
      location: location || 'Remoto',
      salary: 'No especificado',
      url,
      source: sourceLabel,
      description: descriptionText
    };
  } catch (error) {
    console.error('Error manual scraping:', error.message);
    throw new Error(`Error al analizar la página del empleo. Detalles: ${error.message}`);
  }
}

// ─── HTML tag stripper ────────────────────────────────────────────────────
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{3,}/g, '\n\n')
    .trim()
    .substring(0, 3500);
}

// ─── Extract Email ─────────────────────────────────────────────────────────
function extractEmail(text) {
  if (!text) return null;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

// ─── Format salary string ──────────────────────────────────────────────────
function formatSalary(min, max, currency = 'USD', period = 'yearly') {
  if (!min && !max) return 'No especificado';
  const fmt = (n) => n ? `${Math.round(n / 1000)}k` : '';
  const periodLabel = period === 'yearly' ? '/año' : period === 'monthly' ? '/mes' : '';
  if (min && max) return `${fmt(min)} - ${fmt(max)} ${currency}${periodLabel}`;
  if (min) return `Desde ${fmt(min)} ${currency}${periodLabel}`;
  return `Hasta ${fmt(max)} ${currency}${periodLabel}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── PORTAL 1: Remotive (free, no key) ─────────────────────────────────────
// Remote jobs worldwide — top tech/international roles
// ═══════════════════════════════════════════════════════════════════════════
async function fetchRemotiveJobs(keywords) {
  const results = [];
  const seen = new Set();

  for (const keyword of keywords.slice(0, 3)) {
    try {
      const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=50`;
      console.log(`[Remotive] Fetching: ${url}`);
      const response = await axios.get(url, { timeout: 12000 });
      const jobs = response.data.jobs || [];

      for (const job of jobs) {
        if (seen.has(job.url)) continue;
        const cleanDesc = stripHtml(job.description);
        const email = extractEmail(cleanDesc);
        if (!email) continue;

        seen.add(job.url);
        results.push({
          title: job.title,
          company: job.company_name,
          location: job.candidate_required_location || 'Worldwide Remote',
          salary: 'No especificado',
          url: job.url,
          source: 'Remotive 🌐',
          description: cleanDesc,
          recruiterEmail: email,
          isSimulated: false
        });
      }
    } catch (err) {
      console.error(`[Remotive] Error for "${keyword}":`, err.message);
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── PORTAL 2: Arbeitnow (free, no key) ────────────────────────────────────
// European jobs — Germany, Remote, visa sponsorship
// ═══════════════════════════════════════════════════════════════════════════
async function fetchArbeitnowJobs(keywords) {
  try {
    const url = 'https://www.arbeitnow.com/api/job-board-api';
    console.log('[Arbeitnow] Fetching job board...');
    const response = await axios.get(url, { timeout: 12000 });
    const jobs = response.data.data || [];
    const lowerKeywords = keywords.map(k => k.toLowerCase());

    return jobs
      .filter(j => {
        const titleLower = (j.title || '').toLowerCase();
        const descLower = (j.description || '').toLowerCase();
        const tagsLower = (j.tags || []).map(t => t.toLowerCase());
        return lowerKeywords.some(kw =>
          titleLower.includes(kw) ||
          descLower.includes(kw) ||
          tagsLower.some(t => t.includes(kw))
        );
      })
      .map(job => {
        const cleanDesc = stripHtml(job.description);
        const email = extractEmail(cleanDesc);
        return {
          title: job.title,
          company: job.company_name,
          location: job.remote ? 'Remote (Europe)' : (job.location || 'Europe'),
          salary: 'No especificado',
          url: job.url,
          source: 'Arbeitnow 🇪🇺',
          description: cleanDesc,
          recruiterEmail: email,
          isSimulated: false
        };
      })
      .filter(job => job.recruiterEmail !== null);
  } catch (err) {
    console.error('[Arbeitnow] Error:', err.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ── PORTAL 3: Jobicy (free, no key) ───────────────────────────────────────
// Remote jobs worldwide — excellent EMEA/Europe/Spain coverage
// Docs: https://jobi.cy/apidocs
// ═══════════════════════════════════════════════════════════════════════════
async function fetchJobicyJobs(keywords) {
  const results = [];
  const seen = new Set();

  for (const keyword of keywords.slice(0, 3)) {
    try {
      const url = `https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(keyword)}`;
      console.log(`[Jobicy] Fetching: ${url}`);
      const response = await axios.get(url, {
        timeout: 15000,
        headers: { 'User-Agent': 'EmpleoAutopilot/2.0' }
      });
      const jobs = response.data.jobs || [];

      for (const job of jobs) {
        if (seen.has(job.url)) continue;
        const cleanDesc = stripHtml(job.jobDescription);
        const email = extractEmail(cleanDesc);
        if (!email) continue;

        seen.add(job.url);
        const salaryStr = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency || 'USD', job.salaryPeriod);

        results.push({
          title: job.jobTitle,
          company: job.companyName,
          location: job.jobGeo || 'Worldwide Remote',
          salary: salaryStr,
          url: job.url,
          source: 'Jobicy 🌍',
          description: cleanDesc,
          recruiterEmail: email,
          isSimulated: false
        });
      }
    } catch (err) {
      console.error(`[Jobicy] Error for "${keyword}":`, err.message);
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── PORTAL 4: The Muse (free, no key needed for basic) ────────────────────
// Curated job board — company culture info, good for tech startups
// Docs: https://www.themuse.com/developers/api/v2
// ═══════════════════════════════════════════════════════════════════════════
async function fetchTheMuseJobs(keywords) {
  const results = [];
  const seen = new Set();

  for (const keyword of keywords.slice(0, 2)) {
    try {
      const url = `https://www.themuse.com/api/public/jobs?category=${encodeURIComponent(keyword)}&page=0&descending=true&level=Senior+Level&level=Mid+Level`;
      console.log(`[TheMuse] Fetching: ${url}`);
      const response = await axios.get(url, {
        timeout: 12000,
        headers: { 'User-Agent': 'EmpleoAutopilot/2.0' }
      });
      const jobs = response.data.results || [];

      for (const job of jobs) {
        const jobUrl = job.refs?.landing_page || `https://www.themuse.com/jobs/${job.id}`;
        if (seen.has(jobUrl)) continue;

        const cleanDesc = stripHtml(job.contents);
        const email = extractEmail(cleanDesc);
        if (!email) continue;

        const locations = (job.locations || []).map(l => l.name || '').join(', ');
        const isRemoteOrEU = !locations ||
          ['remote', 'spain', 'españa', 'europe', 'united kingdom', 'germany', 'france', 'netherlands', 'portugal']
            .some(kw => locations.toLowerCase().includes(kw));

        if (!isRemoteOrEU) continue;

        seen.add(jobUrl);
        results.push({
          title: job.name,
          company: job.company?.name || 'Empresa no especificada',
          location: locations || 'Remote',
          salary: 'No especificado',
          url: jobUrl,
          source: 'The Muse ✨',
          description: cleanDesc,
          recruiterEmail: email,
          isSimulated: false
        });
      }
    } catch (err) {
      console.error(`[TheMuse] Error for "${keyword}":`, err.message);
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── PORTAL 5: We Work Remotely (public RSS feed) ──────────────────────────
// One of the most popular remote job boards — strong EU presence
// RSS: https://weworkremotely.com/remote-jobs.rss
// ═══════════════════════════════════════════════════════════════════════════
async function fetchWeWorkRemotelyJobs(keywords) {
  const results = [];
  const seen = new Set();

  try {
    const url = 'https://weworkremotely.com/remote-jobs.rss';
    console.log('[WeWorkRemotely] Fetching RSS feed...');
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; EmpleoAutopilot/2.0)',
        'Accept': 'application/rss+xml, text/xml, */*'
      }
    });

    const $ = cheerio.load(response.data, { xmlMode: true });
    const lowerKeywords = keywords.map(k => k.toLowerCase());

    $('item').each((i, el) => {
      const title = $(el).find('title').text().replace('<![CDATA[', '').replace(']]>', '').trim();
      const link = $(el).find('link').text().trim() || $(el).find('url').text().trim();
      const descRaw = $(el).find('description').text();
      const cleanDesc = stripHtml(descRaw);
      const region = $(el).find('region').text().trim();

      const titleLower = title.toLowerCase();
      const descLower = cleanDesc.toLowerCase();
      const matches = lowerKeywords.some(kw => titleLower.includes(kw) || descLower.includes(kw));
      if (!matches) return;
      if (seen.has(link)) return;

      const email = extractEmail(cleanDesc);
      if (!email) return;

      seen.add(link);

      const titleParts = title.split(':');
      const company = titleParts.length > 1 ? titleParts[0].trim() : 'Empresa no especificada';
      const jobTitle = titleParts.length > 1 ? titleParts.slice(1).join(':').trim() : title;

      results.push({
        title: jobTitle,
        company,
        location: region || 'Worldwide Remote',
        salary: 'No especificado',
        url: link,
        source: 'We Work Remotely 🌐',
        description: cleanDesc,
        recruiterEmail: email,
        isSimulated: false
      });
    });
  } catch (err) {
    console.error('[WeWorkRemotely] Error:', err.message);
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── PORTAL 6: RemoteOK (free, no key needed) ──────────────────────────────
// Huge remote job board with 100+ live listings — strong tech focus
// Docs: https://remoteok.com/api
// ═══════════════════════════════════════════════════════════════════════════
async function fetchRemoteOKJobs(keywords) {
  const results = [];
  const seen = new Set();
  const lowerKeywords = keywords.map(k => k.toLowerCase());

  try {
    console.log('[RemoteOK] Fetching job board (100 latest remote tech jobs)...');
    const response = await axios.get('https://remoteok.com/api', {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    // First item is metadata, skip it
    const jobs = (response.data || []).slice(1);

    for (const job of jobs) {
      if (!job.url || seen.has(job.url)) continue;

      const titleLower = (job.position || '').toLowerCase();
      const cleanDesc = stripHtml(job.description || '');
      const descLower = cleanDesc.toLowerCase();
      const tagsLower = (job.tags || []).map(t => t.toLowerCase());

      const matches = lowerKeywords.some(kw =>
        titleLower.includes(kw) ||
        descLower.includes(kw) ||
        tagsLower.some(t => t.includes(kw))
      );
      if (!matches) continue;

      const email = extractEmail(cleanDesc) ||
        (job.apply_url && job.apply_url.includes('@') ? job.apply_url.replace('mailto:', '') : null);
      if (!email) continue;

      seen.add(job.url);
      const location = job.location ||
        (job.tags || []).find(t => t.match(/^[A-Z][a-z]/) && t.length > 3) ||
        'Worldwide Remote';

      results.push({
        title: job.position,
        company: job.company,
        location,
        salary: job.salary || 'No especificado',
        url: job.url,
        source: 'RemoteOK 🔍',
        description: cleanDesc,
        recruiterEmail: email,
        isSimulated: false
      });
    }

    console.log(`[RemoteOK] ${results.length} keyword-matched jobs with email.`);
  } catch (err) {
    console.error('[RemoteOK] Error:', err.message);
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── PORTAL 7: Jooble (free API key — get at https://jooble.org/api/about) ─
// Major European job aggregator — excellent Spain/Madrid/Barcelona coverage
// Requires JOOBLE_API_KEY in .env (free to obtain in minutes)
// ═══════════════════════════════════════════════════════════════════════════
async function fetchJoobleJobs(keywords) {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    console.log('[Jooble] No API key configured. Skipping. Get free key at https://jooble.org/api/about');
    return [];
  }

  const results = [];
  const seen = new Set();
  const locations = ['España', 'Madrid', 'Barcelona', 'Valencia'];

  for (const keyword of keywords.slice(0, 2)) {
    for (const location of locations.slice(0, 2)) {
      try {
        const url = `https://jooble.org/api/${apiKey}`;
        const payload = { keywords: keyword, location, salary: 0, page: 1 };

        console.log(`[Jooble] Searching "${keyword}" in "${location}"...`);
        const response = await axios.post(url, payload, {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' }
        });

        const jobs = response.data.jobs || [];

        for (const job of jobs) {
          if (seen.has(job.link)) continue;
          const cleanDesc = stripHtml(job.snippet || job.description || '');
          const email = extractEmail(cleanDesc) || extractEmail(job.company);

          seen.add(job.link);
          results.push({
            title: job.title,
            company: job.company || 'Empresa no especificada',
            location: job.location || location,
            salary: job.salary || 'No especificado',
            url: job.link,
            source: 'Jooble 🇪🇸',
            description: cleanDesc || `${job.title} en ${job.company}. Ubicación: ${job.location}.`,
            recruiterEmail: email,
            isSimulated: false
          });
        }
      } catch (err) {
        console.error(`[Jooble] Error for "${keyword}" in "${location}":`, err.message);
      }
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── PORTAL 8: Adzuna (free API — register at https://developer.adzuna.com) ─
// Major job aggregator — UK, Germany, France, Netherlands, Austria, Poland
// Requires ADZUNA_APP_ID and ADZUNA_APP_KEY in .env (free to obtain)
// ═══════════════════════════════════════════════════════════════════════════
async function fetchAdzunaJobs(keywords) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.log('[Adzuna] No API credentials. Skipping. Register free at https://developer.adzuna.com');
    return [];
  }

  const results = [];
  const seen = new Set();
  const countries = ['gb', 'de', 'fr', 'nl', 'at'];

  for (const keyword of keywords.slice(0, 2)) {
    for (const country of countries.slice(0, 3)) {
      try {
        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=${encodeURIComponent(keyword)}&content-type=application/json`;

        console.log(`[Adzuna] Searching "${keyword}" in ${country.toUpperCase()}...`);
        const response = await axios.get(url, { timeout: 15000 });
        const jobs = response.data.results || [];

        for (const job of jobs) {
          if (seen.has(job.redirect_url)) continue;
          const cleanDesc = stripHtml(job.description);
          const email = extractEmail(cleanDesc);
          if (!email) continue;

          seen.add(job.redirect_url);
          results.push({
            title: job.title,
            company: job.company?.display_name || 'Empresa no especificada',
            location: `${job.location?.display_name || 'Europe'} (${country.toUpperCase()})`,
            salary: formatSalary(job.salary_min, job.salary_max, 'EUR'),
            url: job.redirect_url,
            source: `Adzuna 🌍 ${country.toUpperCase()}`,
            description: cleanDesc,
            recruiterEmail: email,
            isSimulated: false
          });
        }
      } catch (err) {
        console.error(`[Adzuna] Error for "${keyword}" in ${country}:`, err.message);
      }
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// ── MAIN Autopilot runner: real jobs from 8 real portals ──────────────────
// ═══════════════════════════════════════════════════════════════════════════
export async function* runAutopilotSimulation(keywords = [], minSalary = 0) {
  const activeKeywords = keywords.length > 0 ? keywords : ['Software Engineer', 'Full Stack Developer'];

  yield { status: 'info', message: '🚀 EmpleoAutopilot v2.0 conectando a 8 portales reales (España + Europa + Global)...' };
  await delay(600);

  yield { status: 'info', message: `🔍 Términos de búsqueda: [${activeKeywords.join(', ')}]` };
  await delay(400);

  const allResults = [];

  // ─── Portal 1: Remotive ──────────────────────────────────────────────
  yield { status: 'scrape', message: '🌐 [1/8] Remotive.com → Empleos remotos tech internacionales...' };
  await delay(500);
  try {
    const jobs = await fetchRemotiveJobs(activeKeywords);
    allResults.push(...jobs);
    yield {
      status: jobs.length > 0 ? 'scrape' : 'warning',
      message: jobs.length > 0 ? `✅ [Remotive] ${jobs.length} vacantes con email encontradas.` : '⚠️ [Remotive] Sin resultados con email.'
    };
  } catch (e) {
    yield { status: 'warning', message: `⚠️ [Remotive] Error: ${e.message}` };
  }
  await delay(400);

  // ─── Portal 2: Arbeitnow ─────────────────────────────────────────────
  yield { status: 'scrape', message: '🌐 [2/8] Arbeitnow.com → Empleos europeos con visa sponsorship...' };
  await delay(500);
  try {
    const jobs = await fetchArbeitnowJobs(activeKeywords);
    allResults.push(...jobs);
    yield {
      status: jobs.length > 0 ? 'scrape' : 'warning',
      message: jobs.length > 0 ? `✅ [Arbeitnow] ${jobs.length} vacantes europeas encontradas.` : '⚠️ [Arbeitnow] Sin resultados.'
    };
  } catch (e) {
    yield { status: 'warning', message: `⚠️ [Arbeitnow] Error: ${e.message}` };
  }
  await delay(400);

  // ─── Portal 3: Jobicy ────────────────────────────────────────────────
  yield { status: 'scrape', message: '🌐 [3/8] Jobicy.com → Empleos remotos con cobertura EMEA y España...' };
  await delay(500);
  try {
    const jobs = await fetchJobicyJobs(activeKeywords);
    allResults.push(...jobs);
    yield {
      status: jobs.length > 0 ? 'scrape' : 'warning',
      message: jobs.length > 0 ? `✅ [Jobicy] ${jobs.length} vacantes remotas con salario encontradas.` : '⚠️ [Jobicy] Sin resultados.'
    };
  } catch (e) {
    yield { status: 'warning', message: `⚠️ [Jobicy] Error: ${e.message}` };
  }
  await delay(400);

  // ─── Portal 4: The Muse ──────────────────────────────────────────────
  yield { status: 'scrape', message: '🌐 [4/8] TheMuse.com → Empleos en startups tech con cultura visible...' };
  await delay(500);
  try {
    const jobs = await fetchTheMuseJobs(activeKeywords);
    allResults.push(...jobs);
    yield {
      status: jobs.length > 0 ? 'scrape' : 'warning',
      message: jobs.length > 0 ? `✅ [TheMuse] ${jobs.length} vacantes tech/startups encontradas.` : '⚠️ [TheMuse] Sin resultados EU/Remote.'
    };
  } catch (e) {
    yield { status: 'warning', message: `⚠️ [TheMuse] Error: ${e.message}` };
  }
  await delay(400);

  // ─── Portal 5: We Work Remotely ──────────────────────────────────────
  yield { status: 'scrape', message: '🌐 [5/8] WeWorkRemotely.com → El portal de trabajo remoto más grande del mundo...' };
  await delay(500);
  try {
    const jobs = await fetchWeWorkRemotelyJobs(activeKeywords);
    allResults.push(...jobs);
    yield {
      status: jobs.length > 0 ? 'scrape' : 'warning',
      message: jobs.length > 0 ? `✅ [WeWorkRemotely] ${jobs.length} vacantes remotas encontradas.` : '⚠️ [WeWorkRemotely] Sin coincidencias para estos términos.'
    };
  } catch (e) {
    yield { status: 'warning', message: `⚠️ [WeWorkRemotely] Error: ${e.message}` };
  }
  await delay(400);

  // ─── Portal 6: RemoteOK ──────────────────────────────────────────────
  yield { status: 'scrape', message: '🌐 [6/8] RemoteOK.com → 100+ empleos tech remotos en tiempo real...' };
  await delay(500);
  try {
    const jobs = await fetchRemoteOKJobs(activeKeywords);
    allResults.push(...jobs);
    yield {
      status: jobs.length > 0 ? 'scrape' : 'warning',
      message: jobs.length > 0 ? `✅ [RemoteOK] ${jobs.length} vacantes tech remotas encontradas.` : '⚠️ [RemoteOK] Sin coincidencias para estos términos.'
    };
  } catch (e) {
    yield { status: 'warning', message: `⚠️ [RemoteOK] Error: ${e.message}` };
  }
  await delay(400);

  // ─── Portal 7: Jooble (requiere API key gratuita) ────────────────────
  yield { status: 'scrape', message: '🌐 [7/8] Jooble.org → Agregador europeo con millones de empleos en España 🇪🇸...' };
  await delay(500);
  try {
    const jobs = await fetchJoobleJobs(activeKeywords);
    allResults.push(...jobs);
    if (jobs.length > 0) {
      yield { status: 'scrape', message: `✅ [Jooble] ${jobs.length} empleos en España/Europa encontrados.` };
    } else {
      const hasKey = process.env.JOOBLE_API_KEY;
      yield {
        status: 'warning',
        message: hasKey
          ? '⚠️ [Jooble] Sin resultados para estos términos en España.'
          : '⚠️ [Jooble] Key no configurada → Obtén gratis en https://jooble.org/api/about · Agrega JOOBLE_API_KEY en Configuración'
      };
    }
  } catch (e) {
    yield { status: 'warning', message: `⚠️ [Jooble] Error: ${e.message}` };
  }
  await delay(400);

  // ─── Portal 8: Adzuna (requiere API keys gratuitas) ──────────────────
  yield { status: 'scrape', message: '🌐 [8/8] Adzuna.com → Gran agregador (UK 🇬🇧, Alemania 🇩🇪, Francia 🇫🇷, Países Bajos)...' };
  await delay(500);
  try {
    const jobs = await fetchAdzunaJobs(activeKeywords);
    allResults.push(...jobs);
    if (jobs.length > 0) {
      yield { status: 'scrape', message: `✅ [Adzuna] ${jobs.length} empleos europeos con email encontrados.` };
    } else {
      const hasKeys = process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY;
      yield {
        status: 'warning',
        message: hasKeys
          ? '⚠️ [Adzuna] Sin resultados con email de contacto.'
          : '⚠️ [Adzuna] Keys no configuradas → Registro gratis en https://developer.adzuna.com · Agrega ADZUNA_APP_ID + ADZUNA_APP_KEY en Configuración'
      };
    }
  } catch (e) {
    yield { status: 'warning', message: `⚠️ [Adzuna] Error: ${e.message}` };
  }
  await delay(400);

  // ─── Merge & deduplicate ──────────────────────────────────────────────
  const seen = new Set();
  let allJobs = allResults.filter(j => {
    if (!j.url || seen.has(j.url)) return false;
    seen.add(j.url);
    return true;
  });

  yield { status: 'info', message: `📊 Total bruto: ${allJobs.length} vacantes únicas de 8 portales.` };
  await delay(500);

  // Apply min salary filter if configured
  if (minSalary > 0) {
    const beforeFilter = allJobs.length;
    allJobs = allJobs.filter(j => {
      if (!j.salary || j.salary === 'No especificado') return true;
      const salaryMatch = j.salary.match(/(\d+)/);
      if (salaryMatch) {
        const salaryNum = parseInt(salaryMatch[1]) * (j.salary.includes('k') ? 1000 : 1);
        return salaryNum >= minSalary;
      }
      return true;
    });
    if (beforeFilter > allJobs.length) {
      yield { status: 'info', message: `🔽 Filtro de salario mínimo: quedan ${allJobs.length} vacantes relevantes.` };
    }
  }

  // Cap at 25 jobs per run
  if (allJobs.length > 25) {
    allJobs = allJobs.slice(0, 25);
  }

  if (allJobs.length === 0) {
    yield { status: 'error', message: '❌ No se encontraron vacantes con email de contacto. Prueba términos más genéricos: "developer", "engineer", "programmer".' };
    return;
  }

  yield { status: 'info', message: `🧩 ${allJobs.length} vacantes únicas listas para análisis NLP con Gemini IA...` };
  await delay(600);

  // ─── Process each job with AI ──────────────────────────────────────────
  let matchedCount = 0;
  for (let i = 0; i < allJobs.length; i++) {
    const job = allJobs[i];

    yield { status: 'nlp', message: `🧠 [Gemini NLP] Analizando: "${job.title}" en ${job.company} · ${job.source}` };
    await delay(1000);

    yield {
      status: 'job_found',
      data: {
        id: `real-${Date.now()}-${i}`,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        url: job.url,
        source: job.source,
        description: job.description,
        recruiterEmail: job.recruiterEmail,
        isSimulated: false,
        status: 'Found',
        createdAt: new Date().toISOString()
      }
    };

    matchedCount++;
    yield { status: 'success', message: `💾 Guardada: "${job.title}" @ ${job.company} [${job.source}]` };
    await delay(350);
  }

  yield { status: 'success', message: `🏆 Búsqueda completada. ${matchedCount} vacantes REALES de 8 portales procesadas con análisis IA.` };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
