if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('../service-worker.js').then(function(registration) {
      // Registration was successful
    }, function(err) {
      // registration failed :(
    });
  });
}