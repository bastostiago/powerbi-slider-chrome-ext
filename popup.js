
  
const POWER_BI_SERVICE_URL = 'https://app.powerbi.com';
const POWER_BI_SLIDER_URL = 'https://powerbislider.com';

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  const url = tabs[0].url;
  console.log(url.replace('www', ''));

  const disabledMessage = document.getElementById('disabledMessage');  
  const pbSliderMessage = document.getElementById('pbSliderMessage');  
  let others = true;

  //check Power BI Service
  if (url.startsWith(POWER_BI_SERVICE_URL)) {
    others = false;
    disabledMessage.remove();
    pbSliderMessage.remove();

    // Verificar se a URL contém um grupo e um relatório
    const regex = /groups\/([0-9a-f-]+)\/reports\/([0-9a-f-]+)/;
    const match = url.match(regex);
    //report.fullscreen()      

    const configBtn = document.getElementById('configBtn');
    if (match) {      
      // Habilitar o botão e configurar o redirecionamento
      configBtn.disabled = false;
      configBtn.onclick = function() {
        const groupId = match[1];
        const reportId = match[2];
        const targetUrl = `https://powerbislider.com/home/${groupId}/report/${reportId}`;
        window.open(targetUrl, '_blank');
      };
    } else {
      // Desabilitar o botão se a URL não contém os identificadores necessários
      //chrome.action.disable();
    }
  }

  //check Power BI Slider url
  if (url.replace('www.', '').startsWith(POWER_BI_SLIDER_URL)) {    
    others = false;
    disabledMessage.remove();
  }

  //check others url
  if (others) {
    pbSliderMessage.remove();
  }
  
});

  