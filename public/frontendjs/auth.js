const $authMessageContainer = $('#auth-message-container');
const $submitBtn = $('.register-btn');

const displayAuthMessage = (message, type) => {
    $authMessageContainer.removeClass('success error').text('');
    $authMessageContainer.text(message).addClass(type); 
    $authMessageContainer.css({ 'opacity': 1, 'transform': 'translateY(0)' }); 

    setTimeout(() => {
        $authMessageContainer.css({ 'opacity': 0, 'transform': 'translateY(-10px)' });
        setTimeout(() => {
            $authMessageContainer.text('');
        }, 300);
    }, 5000); 
};

$(document).ready(function() {
    const $registerForm = $('form[action="/register/request"]');
    
    if ($registerForm.length) {
        $registerForm.on('submit', async function(e) {
            e.preventDefault(); 
            
            if ($submitBtn.prop('disabled')) return;
            
            const email = $('#email').val().trim();
            
            if (!email || !email.includes('@')) {
                displayAuthMessage('Please enter a valid email address.', 'error');
                return;
            }
            
            $submitBtn.prop('disabled', true).html('<div class="spinner"></div> Sending...');
            
            try {
                const response = await fetch('/register/request', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                logger.log('auth.js:fetching from /register/request', response);
                
                const data = await response.json();
                logger.log('auth.js:response from /register/request', data);
                
                if (response.ok) {
                    displayAuthMessage(data.message, 'success');
                    $registerForm[0].reset(); 
                    $submitBtn.text('Email Sent!');
                } else {
                    displayAuthMessage(data.error || 'Failed to send email.', 'error');
                    logger.log('auth.js: ', data.error);
                    $submitBtn.prop('disabled', false).text('Send Verification Email');
                }
            } catch (error) {
                displayAuthMessage('Network error. Please try again.', 'error');
                logger.log('auth.js', error);
                $submitBtn.prop('disabled', false).text('Send Verification Email');
            }
        });
    }
    // 1. Load the audio file into memory
  const clickSound = new Audio('path/to/your/click-sound.mp3');
  
  // 2. Set the volume (tactile sounds should be subtle, around 20-50%)
  clickSound.volume = 0.3; 

  // 3. Grab all the buttons you want to make tactile
  const tactileButtons = document.querySelectorAll('.tactile-btn');

  // 4. Attach the sound to the click event
  tactileButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Reset the audio to the beginning in case of rapid, repeated clicks
      clickSound.currentTime = 0; 
      clickSound.play().catch(error => {
          // Browsers sometimes block audio if the user hasn't interacted with the page yet.
          // This catch block prevents errors from showing in your console.
          console.log("Audio play prevented by browser policy.");
      });
    });
  });
});