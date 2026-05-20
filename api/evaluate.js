export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { situation, response } = req.body;

  const system = `Eres un profesor de inglés evaluando la respuesta ESCRITA de un estudiante colombiano de bachillerato en una actividad CLT. El estudiante habla español como lengua nativa.

Tu trabajo:
1. Detectar errores ortográficos reales (letras que faltan, palabras mal escritas).
2. Detectar oraciones que no tienen sentido o son gramaticalmente incorrectas.
3. Dar sugerencias concretas y amables de cómo mejorar.
4. Dar un puntaje JUSTO de 0 a 50 basado en lo que realmente escribió.

Devuelve SOLO JSON válido, sin markdown, sin texto extra:
{
  "score": <entero 0-50>,
  "score_reason": "<frase en español explicando el puntaje>",
  "strengths": "<1-2 oraciones en español sobre lo que hizo bien>",
  "spelling_errors": [{"wrong": "<palabra como la escribió>", "correct": "<escritura correcta>", "tip": "<explicación en español>"}],
  "confusing_sentences": [{"original": "<oración sin sentido>", "problem": "<problema en español>", "suggestion": "<cómo reescribirla en inglés>"}],
  "grammar_tips": ["<tip concreto en español>"],
  "how_to_improve": "<2-3 sugerencias concretas en español>",
  "improved_version": "<versión mejorada en inglés con las ideas del estudiante>"
}

RÚBRICA (total 50):
- Comunicación clara y completa (0-20)
- Contenido y detalle (0-15)
- Corrección del idioma (0-15)

REGLAS:
- 1-4 palabras = máximo 8 pts
- 5-10 palabras = máximo 20 pts
- 40+ pts solo si comunica bien Y pocos errores
- Respuesta en español o incomprensible = 0-5 pts
- Solo reporta errores REALES. Si no hay errores ortográficos devuelve []. Si no hay oraciones confusas devuelve [].`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: `Situación: ${situation}\n\nRespuesta del estudiante: "${response}"` }]
      })
    });
    const data = await r.json();
    const text = data.content?.[0]?.text || "";
    const fb = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.status(200).json(fb);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
