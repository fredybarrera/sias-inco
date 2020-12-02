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
  "dojo/_base/declare", 
  "dojo/dom",
  "jimu/dijit/Message",
  "dojo/Deferred",
  "dojo/_base/lang",
	"dojo/_base/array",
	"dojo/json",
  "jimu/BaseWidget",
  "esri/toolbars/draw",
  "esri/toolbars/edit",
  "esri/graphic",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/Color",
  'esri/layers/GraphicsLayer',
  "dojo/_base/event",
  "esri/tasks/AreasAndLengthsParameters",
  "esri/tasks/GeometryService",
  "esri/geometry/webMercatorUtils",
  "esri/geometry/geometryEngine",
  "esri/geometry/Polygon",
  "esri/SpatialReference",
  "esri/InfoTemplate", 
  "esri/geometry/Point", 
  "jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-3.5.1.min.js",
],
function(
  declare, 
  dom,
  Message,
  Deferred,
  lang,
	arrayUtils, 
	JSON,
  BaseWidget, 
  Draw,
  Edit,
  Graphic,
  SimpleLineSymbol,
  SimpleFillSymbol,
  Color,
  GraphicsLayer,
  event,
  AreasAndLengthsParameters,
  GeometryService,
  webMercatorUtils,
  geometryEngine,
  Polygon,
  SpatialReference,
  InfoTemplate,
  Point,
  $){
  return declare(BaseWidget, {
    name: 'Notas de gestión',
    sias: null,
    geometryService: null,

    startup: function(){
      this.inherited(arguments);
      var map = this.map;
      var message = this.showMessage
      var config = this.config
      var getRequest = this.getRequest
      var gLayer = new GraphicsLayer({'id': 'gLayerGraphicNotas'});
      map.addLayer(gLayer);

      var html_infotemplate = this.getInfotemplate()

      console.log('config: ', config);

      // Obtengo las notas de gestión registradas
      let query = '/query?outFields=SIAs_Areas_SIA_ID_Gral&returnGeometry=false&where=1%3D1&f=pjson'
      getRequest(config.urlBase + config.urlKeySias + query).then(
        lang.hitch(this, function(objRes) { 
          if(objRes.features.length > 0)
          {
            let html = '<option value="-1">[Seleccione]</option>';
            arrayUtils.forEach(objRes.features, function(f) {
              html += '<option value="'+ f.attributes.SIAs_Areas_SIA_ID_Gral +'">'+ f.attributes.SIAs_Areas_SIA_ID_Gral +'</option>'
            }, this);
            $('#sel-nota-gestion-sia').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      )

      $('#sel-nota-gestion-sia').change(function() {
        let id_sia = $(this).val();
        gLayer.clear();

        // Aca deberia llamar a las notas de gestion anteriores de la SIA
        // Falta guardar la nota de gestión.


        let query = '/query?outFields=*&returnGeometry=true&where=SIAs_Areas_SIA_ID_Gral=\'' + id_sia + '\'&f=pjson'
        getRequest(config.urlBase + config.urlKeySias + query).then(
          lang.hitch(this, function(objRes) { 
            if(objRes.features.length > 0)
            {
              let data = objRes.features[0].attributes
              let geom = objRes.features[0].geometry
              let sr = objRes.spatialReference

              $("#nota-gestion-detalle-epc").val(data.Dat_SIAs_SIA_EPC);
              $("#nota-gestion-detalle-id-sia").val(data.Dat_SIAs_SIA_ID_LOCAL);
              $("#nota-gestion-detalle-sia-origen").val(data.Dat_SIAs_SIA_Origen);
              $("#nota-gestion-detalle-fecha-solicitud").val(data.Dat_SIAs_Fecha_Solicitud);
              $("#txta-nota-gestion-detalle-texto").text(data.Dat_SIAs_Area_Solicitada);
              $("#nota-gestion-detalle-registrada").val(data.Resgistrado_por);
              $("#nota-gestion-detalle-solicitada").val(data.ID_Solicitante);

              var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color([255,0,0]), 2),new Color([255,255,0,0.25])
              );

              var attr = {
                "Dat_SIAs_SIA_EPC": data.Dat_SIAs_SIA_EPC,
                "Dat_SIAs_SIA_ID_LOCAL": data.Dat_SIAs_SIA_ID_LOCAL,
                "Dat_SIAs_SIA_Origen": data.Dat_SIAs_SIA_Origen,
                "Dat_SIAs_Fecha_Solicitud": data.Dat_SIAs_Fecha_Solicitud,
                "Dat_SIAs_Area_Solicitada": data.Dat_SIAs_Area_Solicitada,
                "Resgistrado_por": data.Resgistrado_por,
                "ID_Solicitante": data.ID_Solicitante,
              };

              console.log('geom.rings: ', geom.rings);
              var latLon
              var infoTemplate = new InfoTemplate("SIA", html_infotemplate);
              var polygon = new Polygon(new SpatialReference(sr));
              arrayUtils.forEach(geom.rings, function(f) {
                polygon.addRing(f)
                latLon = f[0]
              }, this);
              var graphic = new Graphic(polygon, sfs, attr, infoTemplate);
              gLayer.add(graphic);
              point = new Point(latLon[0], latLon[1]);
							map.centerAndZoom(point, 15);
            }
          }),
          function(objErr) {
            console.log('request failed', objErr)
          }
        )
       
      });
    },

    _onclickEnviar: function () {
      var deferred = new Deferred();

      console.log('acaaaaaaaaa');

      // this.getData().then(
      //   lang.hitch(this, function(data) { 
      //     strData = JSON.stringify([data])
      //     this.postRequest(this.config.urlBase + this.config.urlKeySias + '/applyEdits', strData).then(
      //       lang.hitch(this, function(objRes) { 
      //         console.log('objRes: ', objRes)
      //         if (objRes.addResults[0].success === true)
      //         {
      //           this.showMessage('Sia ingresada exitosamente')
      //           deferred.resolve(objRes);
      //         } else {
      //           msg = objRes.addResults[0].error.description
      //           this.showMessage('Error al enviar la información: ' + msg, 'error')
      //         }
      //       }),
      //       function(objErr) {
      //         deferred.resolve([]);
      //       }
      //     )
      //     return deferred.promise;
      //   }),
      //   lang.hitch(this, function(strError) {
      //     console.log('request failed', strError);
      //     this.showMessage(strError, 'error')
      //   })
      // );
    },

    getInfotemplate: function () {
      var html_infotemplate = '<table cellspacing="0" cellpadding="0" style="border: none;"><tbody>'
      html_infotemplate += '<tr><td><b>EPC: </b></td>';
      html_infotemplate += '<td>${Dat_SIAs_SIA_EPC}</td></tr>';
      html_infotemplate += '<tr><td><b>ID SIA: </b></td>';
      html_infotemplate += '<td>${Dat_SIAs_SIA_ID_LOCAL}</td></tr>';
      html_infotemplate += '<tr><td><b>SIA Origen: </b></td>';
      html_infotemplate += '<td>${Dat_SIAs_SIA_Origen}</td></tr>';
      html_infotemplate += '<tr><td><b>Fecha solicitud: </b></td>';
      html_infotemplate += '<td>${Dat_SIAs_Fecha_Solicitud}</td></tr>';
      html_infotemplate += '<tr><td><b>Area solicitada: </b></td>';
      html_infotemplate += '<td>${Dat_SIAs_Area_Solicitada}</td></tr>';
      html_infotemplate += '<tr><td><b>Registrado por: </b></td>';
      html_infotemplate += '<td>${Resgistrado_por}</td></tr>';
      html_infotemplate += '<tr><td><b>Solicitada por: </b></td>';
      html_infotemplate += '<td>${ID_Solicitante}</td></tr>';
      html_infotemplate += '</tbody></table>';
      return html_infotemplate;
    },

    showMessage: function (msg, type) {
      let class_icon = "message-info-icon";
      switch (type) {
        case "error":
          class_icon = "message-error-icon";
          break;
        case "warning":
          class_icon = "message-warning-icon";
          break;
      }

      let content = '<i class="' + class_icon + '">&nbsp;</i>' + msg;

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
        
        let formData = new FormData();
        formData.append('f', 'json');
        formData.append('adds', data);

        let fetchData = {
            method: 'POST',
            body: formData,
            headers: new Headers()
        }

        fetch(url, fetchData)
          .then(data => data.text())
          .then((text) => {
            var data = JSON.parse(text);
            console.log('responseee: ', data)
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


