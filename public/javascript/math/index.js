$(function(){
    $.ajax({
	url: '/math/projects',
	method: 'POST'
    }).done(function(data) {
	var data = JSON.parse(data);
	data.forEach(function(project) {
	    $('#mathProjects').append($(`<a href="https://minecraft.yeung.online/math/${project}">${project}</a>`)).append("<br />").append("<hr />");
	});
    });
});
