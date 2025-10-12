document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('createUserForm');
  const messageDiv = document.getElementById('userMessage');
  const accessDeniedModal = document.getElementById('access-denied-modal');
  const accessDeniedMessage = document.getElementById('access-denied-message');

  // Access denied modal functions
  const showAccessDeniedModal = (message) => {
    if (accessDeniedMessage) {
      accessDeniedMessage.textContent = message || 'You do not have permission to perform this action.';
    }
    if (accessDeniedModal) {
      accessDeniedModal.style.display = 'flex';
    }
  };

  const hideAccessDeniedModal = () => {
    if (accessDeniedModal) {
      accessDeniedModal.style.display = 'none';
    }
  };

  // Access denied modal event handlers
  document.getElementById('close-access-denied')?.addEventListener('click', hideAccessDeniedModal);
  document.getElementById('access-denied-ok')?.addEventListener('click', hideAccessDeniedModal);
  
  // Close modal when clicking outside
  accessDeniedModal?.addEventListener('click', function(e) {
    if (e.target === this) {
      hideAccessDeniedModal();
    }
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    messageDiv.classList.add('d-none');
    messageDiv.classList.remove('alert-success', 'alert-danger');

    const data = {
      username: form.username.value.trim(),
      password: form.password.value,
      name: form.name.value.trim(),
      role: form.role.value
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        messageDiv.textContent = result.message || 'User created!';
        messageDiv.classList.add('alert-success');
        form.reset();
        setTimeout(()=>{
          window.location.href ="/"},2000 //redirect to home page
        )
      } else {
        // Check if it's an access denied error (403)
        if (res.status === 403) {
          showAccessDeniedModal(result.message || 'Access denied. Admin or owner privileges required.');
          logger.apiCall('POST', '/api/users', false);
        } else {
          messageDiv.textContent = result.error || 'Failed to create user.';
          messageDiv.classList.add('alert-danger');
          logger.apiCall('POST', '/api/users', false);
        }
      }
    } catch (err) {
      messageDiv.textContent = 'Network or server error.';
      logger.error('users.js: Error creating user:', err);
      logger.apiCall('POST', '/api/users', false);
      messageDiv.classList.add('alert-danger');
    }
    messageDiv.classList.remove('d-none');
  });
}); 