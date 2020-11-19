///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define([
  'dojo/_base/declare', 
  'jimu/dijit/Message',
  'dojo/Deferred',
  'dojo/_base/lang',
	'dojo/_base/array',
	'dojo/json',
  'jimu/BaseWidget',
  'jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-git1.min.js',
],
function(
  declare, 
  Message,
  Deferred,
  lang,
	arrayUtils, 
	JSON,
  BaseWidget, 
  $){
  return declare(BaseWidget, {
    name: 'Sias',
    sias: null,

    startup: function(){
      var map = this.map;
      var message = this.showMessage
      var config = this.config.sias
      var getRequest = this.getRequest

      // Obtengo los profesionales inco
      var query = '/query?outFields=*&returnGeometry=true&where=1%3D1&f=pjson'
      getRequest(config.urlBase + config.urlKeyProfesionales + query).then(
        lang.hitch(this, function(objRes) { 
          if(objRes.features.length > 0)
          {
            var html = ''
            arrayUtils.forEach(objRes.features, function(f) {
              html += '<option value="'+ f.attributes.ID_ProfesionalINCO +'">'+ f.attributes.Nombre_apellido +'</option>'
            }, this);
            $('#sel-sia-profesional-inco').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      )

      // Obtengo los solicitantes inco
      var query = '/query?outFields=*&returnGeometry=true&where=1%3D1&f=pjson'
      getRequest(config.urlBase + config.urlKeySolicitante + query).then(
        lang.hitch(this, function(objRes) { 
          if(objRes.features.length > 0)
          {
            var html = ''
            arrayUtils.forEach(objRes.features, function(f) {
              html += '<option value="'+ f.attributes.ID_Solicitante +'">'+ f.attributes.Nombre_apellido +'</option>'
            }, this);
            $('#sel-sia-solicitante-inco').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      )

      
      $('.jimu-widget-sias .map-id').click(function(){
        var deferred = new Deferred();
        getRequest(config.urlBase + config.urlKeySias + '?f=pjson').then(
          lang.hitch(this, function(objRes) { 
            console.log('objRes: ', objRes)
            fields = objRes.fields


            deferred.resolve(objRes);
          }),
          function(objErr) {
            deferred.resolve([]);
          }
        )
        return deferred.promise;
      });

      // $('.jimu-widget-sias .my-title').text('title added by jquery.');
      
    },

    showMessage: function (msg, type) {
      var class_icon = "message-info-icon";
      switch (type) {
        case "error":
          class_icon = "message-error-icon";
          break;
        case "warning":
          class_icon = "message-warning-icon";
          break;
      }

      var content = '<i class="' + class_icon + '">&nbsp;</i>' + msg;

      new Message({
        message: content
      });
    },

    getRequest: function (url) {
      try{
        var deferred = new Deferred();
        fetch(url)
          .then(data => data.text())
          .then((text) => {
            var data = JSON.parse(text);
            deferred.resolve(data);
          }).catch(function (error) {
            console.log('request failed', error)
            deferred.reject();
          }
        );
      } catch(err) {
        console.log('request failed', err)
				deferred.reject();
			}
      return deferred.promise;
    },

    postRequest: function (url, data) {
      try{
        var deferred = new Deferred();
        let fetchData = {
            method: 'POST',
            body: data,
            headers: new Headers()
        }
        fetch(url, fetchData)
          .then(data => data.text())
          .then((text) => {
            var data = JSON.parse(text);
            deferred.resolve(data);

          }).catch(function (error) {
            console.log('request failed', error)
            deferred.reject();
          }
        );
      } catch(err) {
        console.log('request failed', err)
				deferred.reject();
			}
      return deferred.promise;
    },
    
    postCreate: function () {
      this.inherited(arguments);
      console.log('postCreate');
    },

    onOpen: function () {
      console.log('onOpen');
    },

    onClose: function () {
      console.log('onClose');
    },

    onMinimize: function () {
      console.log('onMinimize');
    },

    onMaximize: function () {
      console.log('onMaximize');
    },

    onSignIn: function (credential) {
      console.log('onSignIn');
    },

    onSignOut: function () {
      console.log('onSignOut');
    }
  });
});


