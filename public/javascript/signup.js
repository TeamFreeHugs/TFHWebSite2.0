$(function() {
    $('#submit').click(function() {
        var username = $('#fusername').val(),
            password = $('#fpassword').val(),
            password2 = $('#fpassword2').val(),
            email = $('#femail').val();
        $('#signup-error').css('display', 'block');
        if (username === '') $('#signup-error').text('Enter a username');
        else if (password === '') $('#signup-error').text('Enter a password');
        else if (password2 === '') $('#signup-error').text('Reenter your password');
        else if (password !== password2) $('#signup-error').text('Password does not match');
        else if (email === '') $('#signup-error').text('Enter email');
        else {
            $.ajax({
                method: 'POST',
                url: '/users/signup',
                data: {
                    username: username,
                    password: password,
                    email: email
                }
            }).done(function() {
                $('#username').val(username);
                $('#password, #password2').val(password);
                $('#email').val(email);
                $('#realsubmit').click();
            }).fail(function(data) {
                data = data.responseText;
                data = JSON.parse(data);
                $('#signup-error').text(data.reason);
            });
        }
    });
    $('#fake-signup-form-wrapper > input').keydown(function(event) {
        if(event.keyCode == 13) {
            $('#submit').click();
        }
    });
});
