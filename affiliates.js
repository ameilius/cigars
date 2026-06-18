/**
 * Affiliate partners — shared by the map drawer (browser) and SEO node page generator.
 */
var famousSmokeAffiliate = {
  clickUrl: 'https://www.jdoqocy.com/click-101764792-15736363',
  pixelUrl: 'https://www.awltovhc.com/image-101764792-15736363',
  label: 'Shop at Famous Smoke Shop'
};

function buildFamousSmokeBuyHtml() {
  return (
    '<a href="' + famousSmokeAffiliate.clickUrl + '" target="_blank" rel="sponsored noopener noreferrer" class="affiliate-shop-link block text-xs px-3 py-2 rounded-xl bg-[#14817A] text-[#ECF4F2] hover:bg-[#0D5A55] font-medium text-center transition-colors">' +
      famousSmokeAffiliate.label +
    '</a>' +
    '<img src="' + famousSmokeAffiliate.pixelUrl + '" width="1" height="1" border="0" alt="" aria-hidden="true" class="affiliate-tracking-pixel">'
  );
}