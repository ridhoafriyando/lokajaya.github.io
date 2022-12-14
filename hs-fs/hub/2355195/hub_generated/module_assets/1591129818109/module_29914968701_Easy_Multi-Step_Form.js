  var module_25988773931 = (function() {
    var __hs_messages = {};
    i18n_getmessage = function() {
      return hs_i18n_getMessage(__hs_messages, hsVars['language'], arguments); 
    };
    i18n_getlanguage = function() {
      return hsVars['language']; 
    };
jQuery(document).ready(function($){
  window.easyform = {
    is_valid_email: function(email) {
      if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)){
        return (true);
      }
      return (false);
    },
    validate: function( current_fieldset ){
      var valid = true;
      $('input[required],select[required],textarea[required]',current_fieldset).each(function(i,o){
        $('.easyform-error', $(o).parent()).remove();
        if( $(o).val() == '' ) {
          $(o).parent().prepend( $('<span class="easyform-error">!<em>Please don\'t leave the field empty.</em></span>') );
          valid = false;
        } else if($(o).attr('type') == 'email' && !easyform.is_valid_email( $(o).val() )) {
          $(o).parent().prepend( $('<span class="easyform-error">!<em>Invalid email.</em></span>') );
          valid = false;
        } else if( $(o).val() == null ) {
          $(o).parent().prepend( $('<span class="easyform-error">!<em>Please select a value.</em></span>') );
          valid = false;
        }
      });
      $('ul[required]',current_fieldset).each(function(i,o){
        $('.easyform-error', $(o).parent()).remove();
        if( $('.hs-input:checked', $(o).parent()).length < 1 ) {
          $(o).parent().prepend( $('<span class="easyform-error">!<em>Please select at least one.</em></span>') );
          valid = false;
        }
      });
      return valid;
    },
    submit: function(e){
      e.preventDefault();
      
      var self = $(this);
      var formFields = [];
      var valid = true;
      $('.easyform-panel',self).each(function(i,o){
        if( !easyform.validate( $(o) ) ) {
          valid = false;
          $(o).addClass('active').siblings().removeClass('active');
          return;
        }
      });
      if(!valid) {
        easyform.update_progress( self );
        return false;
      }
      
      $('input[type=checkbox]:checked,input[type=radio]:checked,input[type=text],input[type=email],input[type=number],input[type=tel],input[type=date],textarea,select', self).each(function(i,o){
        formFields.push({
          'name':$(o).attr('name'),
          'value':$(o).val()
        });
      });
      
      var formData = {
        fields: formFields,
        context: {
          hutk: self.attr('data-hutk'),
          pageUri: self.attr('data-page-uri'),
          pageName: self.attr('data-page-name'),
          ipAddress: self.attr('data-ip'),
          pageId: self.attr('data-page-id')
        }
      };
      self.addClass('in-progress');
      $.ajax({
        type: 'POST',
        url: self.attr('action'),
        headers: {
          "Content-Type": "application/json"
        },
        data: JSON.stringify(formData),
        success: function(result){
          if( self.attr('data-response-type') == 'redirect' ){
            document.location.replace( self.attr('data-redirect-url') );
            return;
          }
          $('.loading-bar',self).css('width','100%');
          $('.easyform-panel.active fieldset', self).remove();
          $('.easyform-panel__foot', self).remove();
          $('.easyform-panel.active', self).siblings().remove();
          $('.easyform-panel.active', self).append( $(self.attr('data-thankyou')).html() );
          $('.easyform-panel__head', self).find('h3').text('Complete!');
          $('.easyform-panel__head', self).find('p').remove();
          self.removeClass('in-progress');
        },
        error: function(result, error_type){
          var response = JSON.parse(result.responseText);
          self.removeClass('in-progress');
        }
      });
      
    },
    next: function(){
      var form = $(this).parents('form');
      
      if( !easyform.validate( $(this).parents('.easyform-panel') ) ) {
        return false;
      }
      
      $(this).parents('.easyform-panel').next().addClass('active').siblings().removeClass('active');
      easyform.update_progress( form );
    },
    prev: function(){
      var form = $(this).parents('form');
      $(this).parents('.easyform-panel').prev().addClass('active').siblings().removeClass('active');
      easyform.update_progress( form );
    },
    update_progress: function( form ){
      var active_panel = $('.easyform-panel.active', form).index();
      $('.easyform-progress-bar', form).each(function(i,o){
        var bar = $('li', o).eq( active_panel );
        bar.addClass('active').siblings().removeClass('active');
        bar.nextAll().removeClass('done');
        bar.prevAll().addClass('done');      
        var loader_position = ( bar.offset().left + ( bar.width() / 2 ) ) - form.offset().left;
        $('.loading-bar', form).width(`${loader_position}px`);
      });
    },
    resize: function(){
      $('.easyform-form').each(function(i,o){
        easyform.update_progress( $(o) );
      });
    },
    create: function(hsform, options){
      var easyform_form = options.easyForm;
      var context = JSON.parse( hsform.find('[name=hs_context]').val() )
      var field_counter = 0;
      var newform = $('<form />');
      newform.attr('method','POST');
      newform.attr('action','https://api.hsforms.com/submissions/v3/integration/submit/'+options.portalId+'/'+options.formId);
      newform.attr('data-ajax-form','');
      newform.addClass('easyform-form');
      newform.attr('data-hutk', context.hutk);
      newform.attr('data-page-uri', context.pageUrl);
      newform.attr('data-page-name', context.pageTitle);
      newform.attr('data-page-id', context.pageId);
      newform.attr('data-ip', options.ip);
      if(options.responseType == 'redirect') {
        newform.attr('data-redirect-url', options.redirectUrl);
      } else {
        newform.attr('data-thankyou', options.thankyou);
      }      
      newform.attr('data-response-type', options.responseType);
      
      var progressbar = $('<ul />').addClass('easyform-progress-bar');
      $(easyform_form).each(function(i,o){
        progressbar.append( $('<li />').append( $('<span />').text( (i + 1) ) ) );
      });
      progressbar.append( $('<div />').addClass('loading-bar') );
      
      if( $('fieldset[class*=form-columns]',hsform).length ) {
        
        var proceed = true;
        $(easyform_form).each(function(i,o){
          var fields_to_get = o.number_of_fields;

          if( !$('fieldset[class*=form-columns]',hsform).eq(field_counter).length ) {
            proceed = false;
          }

          var fields = $('<div />');
          fields.addClass('easyform-panel').addClass('form-step-'+(i+1));
          if( i < 1 ) { fields.addClass('active'); }
          fields.append( $('<div />').addClass('easyform-panel__head').append( $('<h3 />').text( o.title ) ).append( $('<p />').text( o.message ) ).append( progressbar.clone() ) );

          if( (i+1) >= easyform_form.length ) {
            fields_to_get = $('fieldset[class*=form-columns]',hsform).length - field_counter;
          }

          for(var x=0;x<fields_to_get;x++){
            var _fields = $('fieldset[class*=form-columns]',hsform).eq(field_counter).clone();

            _fields.removeAttr('data-reactid');
            _fields.find('*').removeAttr('data-reactid').removeAttr('id');
            _fields.find('label').removeAttr('placeholder').removeAttr('for').removeAttr('class');
            _fields.find('input').removeAttr('autocomplete');
            _fields.find('select').removeAttr('autocomplete');
            _fields.find('textarea').removeAttr('autocomplete');
            _fields.find('legend').remove();
            fields.append( _fields );
            field_counter++;
          }
          if( i < 1 ) {
            fields.append(
              $('<div />').addClass('easyform-panel__foot').append( 
                $('<button />').attr('type','button').addClass('easyform-next').text('Next') 
              )
            );
          } else if( (i+1) >= $(easyform_form).length  ) {
            fields.append(
              $('<div />').addClass('easyform-panel__foot').append( 
                $('<button />').attr('type','button').addClass('easyform-prev').text('Previous') 
              ).append( 
                $('<button />').attr('type','submit').addClass('easyform-next').text('Submit') 
              )
            );          
          } else {
            fields.append(
              $('<div />').addClass('easyform-panel__foot').append( 
                $('<button />').attr('type','button').addClass('easyform-prev').text('Previous') 
              ).append( 
                $('<button />').attr('type','button').addClass('easyform-next').text('Next') 
              )
            );
          }

          if(proceed) {
            newform.append(fields);
          } else {
            /* this is to remove the last step when it has no fields */
            var panels = newform.find('.easyform-panel');
            panels.eq(panels.length-1).find('.easyform-next').attr('type','submit').text('Submit');
            $('.easyform-progress-bar',panels).each(function(ii,oo){
              $('> li',oo).eq(i).remove();
            });
          }

        });

      } else {
        
        var proceed = true;
        $(easyform_form).each(function(i,o){
          var fields_to_get = o.number_of_fields;
          
          if( !$('.hs-form-field',hsform).eq(field_counter).length ) {
            proceed = false;
          }
    
          var fields = $('<div />');
          fields.addClass('easyform-panel').addClass('form-step-'+(i+1));
          if( i < 1 ) { fields.addClass('active'); }
          fields.append( $('<div />').addClass('easyform-panel__head').append( $('<h3 />').text( o.title ) ).append( $('<p />').text( o.message ) ).append( progressbar.clone() ) );

          if( (i+1) >= easyform_form.length ) {
            fields_to_get = $('.hs-form-field',hsform).length - field_counter;
          }

          for(var x=0;x<fields_to_get;x++){
            var _fields = $('<fieldset />').append( $('.hs-form-field',hsform).eq(field_counter).clone() );

            _fields.removeAttr('data-reactid');
            _fields.find('*').removeAttr('data-reactid').removeAttr('id');
            _fields.find('label').removeAttr('placeholder').removeAttr('for').removeAttr('class');
            _fields.find('input').removeAttr('autocomplete');
            _fields.find('select').removeAttr('autocomplete');
            _fields.find('textarea').removeAttr('autocomplete');
            _fields.find('legend').remove();
            fields.append( _fields );
            field_counter++;
          }
          if( i < 1 ) {
            fields.append(
              $('<div />').addClass('easyform-panel__foot').append( 
                $('<button />').attr('type','button').addClass('easyform-next').text('Next') 
              )
            );
          } else if( (i+1) >= $(easyform_form).length  ) {
            fields.append(
              $('<div />').addClass('easyform-panel__foot').append( 
                $('<button />').attr('type','button').addClass('easyform-prev').text('Previous') 
              ).append( 
                $('<button />').attr('type','submit').addClass('easyform-next').text('Submit') 
              )
            );          
          } else {
            fields.append(
              $('<div />').addClass('easyform-panel__foot').append( 
                $('<button />').attr('type','button').addClass('easyform-prev').text('Previous') 
              ).append( 
                $('<button />').attr('type','button').addClass('easyform-next').text('Next') 
              )
            );
          }

          if(proceed) {
            newform.append(fields);
          } else {
            /* this is to remove the last step when it has no fields */
            var panels = newform.find('.easyform-panel');
            panels.eq(panels.length-1).find('.easyform-next').attr('type','submit').text('Submit');
            $('.easyform-progress-bar',panels).each(function(ii,oo){
              $('> li',oo).eq(i).remove();
            });
          }
          
          
        });
        
      }
        
      $(options.target).append( newform );
      if($(window).width() > 767 ) {
        $('.hs-dateinput .hs-input', newform).datepicker();
      }
      
      easyform.update_progress( newform );
    },
    init: function(){
      $(document).on('submit','[data-ajax-form]',easyform.submit);
      $(document).on('click','.easyform-next', easyform.next);
      $(document).on('click','.easyform-prev', easyform.prev);
      $(window).on('resize',easyform.resize);
      $('[data-easy-form]').each(function(i,o){
        var options = $(o).data();
        options.formData={cssData:''}
        options.onFormSubmitted = () => {
        };
        options.onFormReady = function(e){
          easyform.create(e, options);
        }
        hbspt.forms.create(options);
      });
    },
    
  };
  
  if("undefined"==typeof window.hbspt || "undefined"==typeof window.hbspt.forms) {
  /* let's check if the hubspot form javascript library is loaded
   * this is to avoid embeding the script multiple times 
   * and keep page loading fast
   * */
    var script = document.createElement('script');
    script.onload = function () {
        easyform.init();
    };
    script.src = '/_hcms/forms/v2.js';
    document.body.appendChild(script);
  } else {
    easyform.init();
  }
});
  })();
