if(typeof jQuery.fn.autocompletehtml != 'function') {

(function($) {

function _init($deck,$text) {
  $text.autocompletehtml();
  if($deck.parents(".module.aligned").length > 0) {
      // in django-admin, place deck directly below input
    $deck.position({ 
      my: "right top", 
      at: "right bottom", 
      of: $text, 
      offset: "0 5" 
    });
  }
}
$.fn.autocompletehtml = function() {
  var $text = $(this), sizeul = true;
  this.data("autocomplete")._renderItem = function _renderItemHTML(ul, item) {
    if(sizeul) {
      if(ul.css('max-width')=='none') ul.css('max-width',$text.outerWidth());
      sizeul = false;
    }
    return $("<li></li>")
      .data("item.autocomplete", item)
      .append("<a>" + item.match + "</a>")
      .appendTo(ul);
  };
  return this;
}
$.fn.autocompleteselect = function(options) {

  return this.each(function() {
    var id = this.id;
    var $this = $(this);
  
    var $text = $("#"+id+"_text");
    var $deck = $("#"+id+"_on_deck");

    function receiveResult(event, ui) {
      if ($this.val()) {
        kill();
      }
      //$this.val(ui.item.pk);
      $('input[name='+$this.attr('name')+']').val(ui.item.pk);

      options.select = receiveResult;
      $text.autocomplete(options);

      function reset() {
        if (options.initial) {
          addKiller(options.initial[0], options.initial[1]);
          $this.val(options.initial[1]);
        } else {
          kill();
        }
      }

      if (!$this.attr('data-changed')) {
        reset();
        $this.attr('data-changed', true);
      }

      $this.closest('form').on('reset', reset);

      $this.bind('didAddPopup', function(event, pk, repr) {
        receiveResult(null, {item: {pk: pk, repr: repr}});
      });
    });
  };

  $.fn.autocompleteselectmultiple = function(options) {
    return this.each(function() {
      var id = this.id,
          $this = $(this),
          $text = $('#' + id + '_text'),
          $deck = $('#' + id + '_on_deck');

      function receiveResult(event, ui) {
        var pk = ui.item.pk,
            prev = $this.val();

        if (prev.indexOf('|' + pk + '|') === -1) {
          $this.val((prev ? prev : '|') + pk + '|');
          addKiller(ui.item.repr, pk);
          $text.val('');
          $deck.trigger('added', [ui.item.pk, ui.item]);
          $this.trigger('change');
        }
        return false;
      }
      $("#" + killer_id).click(function() {
        kill();
        $deck.trigger("killed");
        document.getElementById('id_institution_text').style.display='';
      });
    }

      function addKiller(repr, pk) {
        var killId = 'kill_' + pk + id,
            killButton = '<span class="ui-icon ui-icon-trash" id="' + killId + '">X</span> ';
        $deck.append('<div id="' + id + '_on_deck_' + pk + '">' + killButton + repr + ' </div>');

        $('#' + killId).click(function() {
          kill(pk);
          $deck.trigger('killed', [pk]);
        });
      }

      function kill(pk) {
        $this.val($this.val().replace('|' + pk + '|', '|'));
        $('#' + id + '_on_deck_' + pk).fadeOut().remove();
      }

    function addKiller(repr, pk) {
      killer_id = "kill_" + pk + id;
      killButton = '<span class="ui-icon ui-icon-trash" id="'+killer_id+'">X</span> ';
      $deck.append('<div id="'+id+'_on_deck_'+pk+'">' + killButton + repr + ' </div>');

      function reset() {
        $deck.empty();
        var query = '|';
        if (options.initial) {
          $.each(options.initial, function(i, its) {
            addKiller(its[0], its[1]);
            query += its[1] + '|';
          });
        }
        $this.val(query);
      }

      if (!$this.attr('data-changed')) {
        reset();
        $this.attr('data-changed', true);
      }

      $this.closest('form').on('reset', reset);

      $this.bind('didAddPopup', function(event, pk, repr) {
        receiveResult(null, {item: {pk: pk, repr: repr}});
      });
    }

    $this.bind('didAddPopup', function(event, pk, repr) {
      ui = { item: { pk: pk, repr: repr } }
      receiveResult(null, ui);
    });
  });
};
})(jQuery);

  function addAutoComplete(prefix_id, callback/*(html_id)*/) {
    /* detects inline forms and converts the html_id if needed */
    var prefix = 0;
    var html_id = prefix_id;
    if(html_id.indexOf("__prefix__") != -1) {
      // Some dirty loop to find the appropriate element to apply the callback to
      while (jQuery('#'+html_id).length) {
        html_id = prefix_id.replace(/__prefix__/, prefix++);
      }
      html_id = prefix_id.replace(/__prefix__/, prefix-2);
      // Ignore the first call to this function, the one that is triggered when
      // page is loaded just because the "empty" form is there.
      if (jQuery("#"+html_id+", #"+html_id+"_text").hasClass("ui-autocomplete-input"))
        return;
    }
    callback(html_id);
  }

  $.extend(proto, {
    _initSource: function() {
      if (this.options.html && $.isArray(this.options.source)) {
        this.source = function(request, response) {
          response(filter(this.options.source, request.term));
        };
      } else {
        initSource.call(this);
      }
    },
    _renderItem: function(ul, item) {
      var body = this.options.html ? item.match: item.label;
      return $('<li></li>')
        .data('item.autocomplete', item)
        .append($('<a></a>')[this.options.html ? 'html' : 'text' ](body))
        .appendTo(ul);
    }
  });

  /*  the popup handler
    requires RelatedObjects.js which is part of the django admin js
    so if using outside of the admin then you would need to include that manually */
  window.didAddPopup = function (win, newId, newRepr) {
    var name = window.windowname_to_id(win.name);
    $('#' + name).trigger('didAddPopup', [window.html_unescape(newId), window.html_unescape(newRepr)]);
    win.close();
  };

  // activate any on page
  $(window).bind('init-autocomplete', function() {

    $('input[data-ajax-select=autocomplete]').each(function(i, inp) {
      addAutoComplete(inp, function($inp, opts) {
        opts.select =
            function(event, ui) {
              $inp.val(ui.item.value).trigger('added', [ui.item.pk, ui.item]);
              return false;
            };
        $inp.autocomplete(opts);
      });
    });

    $('input[data-ajax-select=autocompleteselect]').each(function(i, inp) {
      addAutoComplete(inp, function($inp, opts) {
        $inp.autocompleteselect(opts);
      });
    });

    $('input[data-ajax-select=autocompleteselectmultiple]').each(function(i, inp) {
      addAutoComplete(inp, function($inp, opts) {
        $inp.autocompleteselectmultiple(opts);
      });
    });

  });

  $(document).ready(function() {
    // if dynamically injecting forms onto a page
    // you can trigger them to be ajax-selects-ified:
    $(window).trigger('init-autocomplete');
    $(document)
      .on('click', '.inline-group ul.tools a.add, .inline-group div.add-row a, .inline-group .tabular tr.add-row td a', function() {
        $(window).trigger('init-autocomplete');
      });
  });

})(window.jQuery);
