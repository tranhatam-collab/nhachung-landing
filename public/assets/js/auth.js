function handleGoogleAuth(response) {
  try {
    const credential = response.credential;
    if (credential) {
      const payload = JSON.parse(atob(credential.split('.')[1]));
      const email = payload.email;
      const name = payload.name || payload.given_name || 'User';
      document.getElementById('google-btn-wrap').style.display = 'none';
      const reveal = document.getElementById('contact-reveal');
      reveal.style.display = 'block';
      reveal.insertAdjacentHTML('afterbegin','<p style="margin-bottom:16px;color:var(--accent);font-weight:600;">Xin chào, ' + name + '!</p>');
      if (window.gtag) { gtag('event','google_signin_success',{email_domain: email.split('@')[1]}); }
    }
  } catch (e) {
    console.error('Google auth error:', e);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('google-login-btn');
  if (btn) {
    btn.addEventListener('click', function() {
      if (window.google && google.accounts && google.accounts.id) {
        google.accounts.id.prompt(function(notification) {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            var cid = '496670862618-nlnkmr4r77fa34lrhnpvqa9gd1hr4kik.apps.googleusercontent.com';
            var ru = encodeURIComponent(window.location.origin + window.location.pathname);
            var oauthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + cid + '&redirect_uri=' + ru + '&response_type=id_token&scope=openid%20email%20profile&nonce=' + Math.random().toString(36).slice(2) + '&prompt=select_account';
            window.location.href = oauthUrl;
          }
        });
      } else {
        var cid = '496670862618-nlnkmr4r77fa34lrhnpvqa9gd1hr4kik.apps.googleusercontent.com';
        var ru = encodeURIComponent(window.location.origin + window.location.pathname);
        var oauthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + cid + '&redirect_uri=' + ru + '&response_type=id_token&scope=openid%20email%20profile&nonce=' + Math.random().toString(36).slice(2) + '&prompt=select_account';
        window.location.href = oauthUrl;
      }
    });
  }

  if (window.location.hash && window.location.hash.includes('id_token=')) {
    var hash = window.location.hash.substring(1);
    var params = new URLSearchParams(hash);
    var idToken = params.get('id_token');
    if (idToken) {
      handleGoogleAuth({credential: idToken});
      history.replaceState(null, null, window.location.pathname + window.location.search);
    }
  }
});
