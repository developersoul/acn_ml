'use strict';
import $ from 'jquery';
import validate from './validate';

function showErrors() {
  let $input = $(this);
  let val = $input.val();
  let name = $input.attr('name');
  let validations = $input.data('validate').split('|');
  let messages = $input.data('messages').split('|');
  let $err = $(`input[name="${name}"]`).parent().find('.input__errors');
  
  $err.empty();

  validations.map((type, i) => {
    if(!validate(type, val)) {
      $input.data('is-valid', false);
      $err.append(messages[i]);
    } else {
      $input.data('is-valid', true);
    }
  });
}

export default function() {
  $('form[data-validate="true"]').on('submit', function(e) {
    e.preventDefault();
    let $form = $(this);
    let inputs = $(this).find('input');
    let isValid = false;
    let results = [false];

    inputs.each(showErrors).promise().done(e => console.log(e));
  });
}


