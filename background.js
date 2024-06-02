chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
      const listAllowedSite = ['https://app.powerbi', 'https://powerbislider.com'];
      const allowedSite = listAllowedSite.filter(x => tab.url.replace('www.', '').startsWith(x));
      console.log('allowed site: ', allowedSite);
      if (allowedSite.length > 0) {        
        chrome.action.setIcon({
          tabId: tabId,
          path: {
            "32": "img/logo_enabled_32.png",
            "72": "img/logo_enabled_72.png",
            "128": "img/logo_enabled_128.png",
            "512": "img/logo_enabled_512.png",
          }
        });
      } else {        
        chrome.action.setIcon({
          tabId: tabId,
          path: {
            "32": "img/logo_disabled_32.png",
            "72": "img/logo_disabled_72.png",
            "128": "img/logo_disabled_128.png",
            "512": "img/logo_disabled_512.png",
          }
        });
      }
    }
  });
  