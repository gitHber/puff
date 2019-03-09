$(function () {
  var color = ["#FFCC00", "#4CD964", "#34AADC", "#007AFF", "#5856D6", "#FF2D55", "#1D77EF", "#FF3A2D", "#5BCAFF", "#007AFF", "#5856D6", "#FF2D55", "#1D77EF", "#FF3A2D", "#5BCAFF", "#FFCC00", "#4CD964", "#34AADC",];
  $(".classificationColor").each(function (index, item) {
      $(item).css("background-color", color[index % color.length])
  })
  $(".cd-timeline-content").each(function (index, item) {
      var frind = "frind-card" + ((index % 10) + 1);
      $(item).addClass(frind);
  })

  var word_list = [];
  var obj;
  $.get(ghost.url.api('users', { include: "count.posts" ,limit: "all"})).done(function (data) {
      $.each(data.users, function (index, item) {
          obj = new Object();
          obj.text = item.name;
          obj.weight = item.count.posts;
          obj.link = '/author/'+item.slug
          word_list.push(obj);
      })
      $("#user-wordcloud").jQCloud(word_list, {
         
      });
  }).fail(function (err) {
      console.log(err);
  });
})


