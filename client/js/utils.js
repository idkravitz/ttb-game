function enable(selector)
{
  $(selector).removeAttr('disabled');
}

function disable(selector)
{
  $(selector).attr('disabled', 'disabled');
}

function inGame()
{
  return 'gameName' in sessionStorage;
}

function addGame(data)
{
  return $.extend(data, { gameName: sessionStorage.gameName });
}

function convertToSlider(input, vmin, vmax, step, cur)
{
  var label = input.prev();
  var prefix = label.text().split(':')[0] + ': ';
  var slider_id = input.attr('id') + '-slider';
  cur = cur || vmin;
  step = step || 1;

  input.hide();
  input.val(cur);
  label.text(prefix + cur);

  $('#' + slider_id).remove();
  input.after(
    $('<div/>', { id: slider_id }).slider({
      range: 'min',
      value: cur,
      min: vmin,
      max: vmax,
      step: step,
      slide: function (event, ui) {
        input.val(parseInt(ui.value));
        label.text(prefix + ui.value);
      }
    })
  );
}
