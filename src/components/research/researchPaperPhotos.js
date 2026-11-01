export default function researchPaperPhotos(note) {
  const frenchFiscalNote = note.slug === 'the-french-fiscal-premium-eurozone-fragmentation-risks';
  return {
    lead: note.hero_image_url ? { url: note.hero_image_url, alt: note.title } : frenchFiscalNote ? {
      url: 'https://media.base44.com/images/public/69b9efd1e34861737a4d8957/62f262b06_generated_443b6840.jpg',
      alt: 'Illustration of the Palais Bourbon colonnade, home of the French National Assembly',
    } : null,
    section: frenchFiscalNote ? {
      heading: 'The Policy Dilemma',
      url: 'https://media.base44.com/images/public/69b9efd1e34861737a4d8957/999e37395_generated_60c1b002.jpg',
      alt: 'Illustration of the European Central Bank building in Frankfurt',
    } : null,
    band: frenchFiscalNote ? {
      url: 'https://media.base44.com/images/public/69b9efd1e34861737a4d8957/6b858825f_generated_10e618d7.jpg',
      alt: 'Illustrative stone institutional facade in muted light',
    } : null,
  };
}