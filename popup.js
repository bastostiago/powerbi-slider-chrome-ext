const POWER_BI_SERVICE_URL = 'https://app.powerbi.com';
const POWER_BI_SLIDER_URL = 'https://powerbislider.com';

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  const url = tabs[0].url;
  console.log(url.replace('www', ''));

  const disabledMessage = document.getElementById('disabledMessage');  
  const pbSliderMessage = document.getElementById('pbSliderMessage');  
  const pbServiceMessage = document.getElementById('pbServiceMessage');  
  const actionButton = document.getElementById('actionButton');  
  let others = true;

  //check Power BI Service
  if (url.startsWith(POWER_BI_SERVICE_URL)) {
    others = false;
    disabledMessage.remove();
    pbSliderMessage.remove();

    // Verificar se a URL contém um grupo e um relatório
    const regex = /groups\/([0-9a-f-]+)\/reports\/([0-9a-f-]+)/;
    const match = url.match(regex);
    
    if (match) {      
      pbServiceMessage.remove();      
      actionButton.onclick = function() {
        const groupId = match[1];
        const reportId = match[2];
        const targetUrl = `https://powerbislider.com/home/${groupId}/report/${reportId}?openSettings=1`;
        window.open(targetUrl, '_blank');
      };
    } else {
      actionButton.remove();
    }
  }

  //check Power BI Slider url
  if (url.replace('www.', '').startsWith(POWER_BI_SLIDER_URL)) {    
    others = false;
    disabledMessage.remove();
    pbServiceMessage.remove();
    actionButton.remove();
  }

  //check others url
  if (others) {
    pbSliderMessage.remove();
    pbServiceMessage.remove();
    actionButton.remove();
  }
  
});

  