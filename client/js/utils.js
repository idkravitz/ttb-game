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

function convertToSlider(input, vmin, vmax, step)
{
  var label = input.prev();
  var prefix = label.text().split(':')[0] + ': ';
  var slider_id = input.attr('id') + '-slider';

  input.hide();
  input.val(vmin);
  label.text(prefix + vmin);

  $('#' + slider_id).remove();
  input.after(
    $('<div/>', { id: slider_id }).slider({
      range: 'min',
      value: vmin,
      min: vmin,
      max: vmax,
      step: step || 1,
      slide: function (event, ui) {
        input.val(parseInt(ui.value));
        label.text(prefix + ui.value);
      }
    })
  );
}
