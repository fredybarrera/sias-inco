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
  // "jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-3.5.1.min.js",
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
  Point){
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

      // Obtengo las notas de gestión registradas
      var query = '/query?outFields=SIAs_Areas_SIA_ID_Gral&orderByFields=SIAs_Areas_SIA_ID_Gral&returnGeometry=false&where=1%3D1&f=pjson';
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
      );


      // Obtengo los estados de gestión.
      var query = '/query?outFields=*&where=1%3D1&f=pjson';
      getRequest(config.urlBase + config.urlKeyEstadoGestion + query).then(
        lang.hitch(this, function(objRes) { 
          if(objRes.features.length > 0)
          {
            let html = '<option value="-1">[Seleccione]</option>';
            arrayUtils.forEach(objRes.features, function(f) {
              html += '<option value="'+ f.attributes.Estados_Gestion +'">'+ f.attributes.Estados_Gestion +'</option>'
            }, this);
            $('#sel-nota-gestion-estado-sia').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );

      // Obtengo los profesionales inco.
      var query = '/query?outFields=*&where=1%3D1&f=pjson';
      getRequest(config.urlBase + config.urlKeyProfesionales + query).then(
        lang.hitch(this, function(objRes) { 
          if(objRes.features.length > 0)
          {
            let html = '<option value="-1">[Seleccione]</option>';
            arrayUtils.forEach(objRes.features, function(f) {
              html += '<option value="'+ f.attributes.Nombre_apellido +'">'+ f.attributes.Nombre_apellido +'</option>'
            }, this);
            $('#sel-nota-gestion-autor').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );


      $('#sel-nota-gestion-sia').change(function() {
        let id_sia = $(this).val();
        gLayer.clear();

        // Obtengo el historial de nostas de gestión de la SIA.
        var query = '/query?outFields=*&orderByFields=Fecha_Nota+desc&where=SIAIDGRAL2=\'' + id_sia + '\'&f=pjson';
        getRequest(config.urlBase + config.urlKeyNotasDeGestion + query).then(
          lang.hitch(this, function(objRes) { 
            if(objRes.features.length > 0)
            {
              let html = '<table class="table table-hover">';
              html += '<thead>';
              html += '<tr>';
              html += '<th scope="col">SIA</th>';
              html += '<th scope="col">Fecha ingreso nota</th>';
              html += '<th scope="col">Estado de gestión</th>';
              html += '<th scope="col">Nota</th>';
              html += '<th scope="col">Nota registrada por</th>';
              html += '</tr>';
              html += '</thead>';
              html += '<tbody>';
              arrayUtils.forEach(objRes.features, function(f) {
                var d = new Date(f.attributes.Fecha_Nota)
                // var options = { year: '2-digit', month: '2-digit', day: '2-digit' };
                var options = {  dateStyle: 'medium' };
                var datetime = d.toLocaleString("es-CL", options);
                html += '<tr>';
                html += '<td>' + f.attributes.SIA_ID_LOCAL + '</td>';
                html += '<td>' + datetime + '</td>';
                html += '<td>' + f.attributes.Estado_gestion + '</td>';
                html += '<td>' + f.attributes.Comentario + '</td>';
                html += '<td>' + f.attributes.Nombre_apellido + '</td>';
                html += '</tr>';
              }, this);

              html += '</tbody>';
              html += '</table>';
              $('#div-notas-registradas').html(html)
            }
          }),
          function(objErr) {
            console.log('request failed', objErr)
          }
        );

        
        var query = '/query?outFields=*&returnGeometry=true&where=SIAs_Areas_SIA_ID_Gral=\'' + id_sia + '\'&f=pjson'
        getRequest(config.urlBase + config.urlKeySias + query).then(
          lang.hitch(this, function(objRes) { 
            if(objRes.features.length > 0)
            {
              let data = objRes.features[0].attributes
              let geom = objRes.features[0].geometry
              let sr = objRes.spatialReference

              var d = new Date(data.Dat_SIAs_Fecha_Solicitud)
              var options = {  dateStyle: 'medium' };
              var datetime = d.toLocaleString("es-CL", options);

              console.log('datetime: ', datetime);

              $("#nota-gestion-detalle-epc").val(data.Dat_SIAs_SIA_EPC);
              $("#nota-gestion-detalle-id-sia").val(data.Dat_SIAs_SIA_ID_LOCAL);
              $("#nota-gestion-detalle-sia-origen").val(data.Dat_SIAs_SIA_Origen);
              $("#nota-gestion-detalle-fecha-solicitud").val(datetime);
              $("#txta-nota-gestion-detalle-texto").text(data.Dat_SIAs_Area_Solicitada);
              $("#txta-nota-gestion-comentario-texto").text(data.Dat_SIAs_Comentario);
              $("#nota-gestion-estado-gestion").val(data.Dat_SIAs_Estados_Gestion);
              $("#nota-gestion-detalle-registrada").val(data.Resgistrado_por);
              $("#nota-gestion-detalle-solicitada").val(data.ID_Solicitante);
              $("#nota-gestion-m2").val(data.SIAs_Areas_Area_m2);
              $("#nota-gestion-id-sia-gral").val(data.SIAs_Areas_SIA_ID_Gral);
              $("#nota-gestion-detalle-objectid").val(data.OBJECTID);

              var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color([255,0,0]), 2),new Color([255,255,0,0.25])
              );


              var attr = {
                "Dat_SIAs_SIA_EPC": data.Dat_SIAs_SIA_EPC,
                "Dat_SIAs_SIA_ID_LOCAL": data.Dat_SIAs_SIA_ID_LOCAL,
                "Dat_SIAs_SIA_Origen": data.Dat_SIAs_SIA_Origen,
                "Dat_SIAs_Fecha_Solicitud": datetime,
                "Dat_SIAs_Area_Solicitada": data.Dat_SIAs_Area_Solicitada,
                "Resgistrado_por": data.Resgistrado_por,
                "ID_Solicitante": data.ID_Solicitante,
                "SIAs_Areas_SIA_ID_Gral": data.SIAs_Areas_SIA_ID_Gral
              };

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
							map.centerAndZoom(point, 16);
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
      var showMessage = this.showMessage;

      this.getData().then(
        lang.hitch(this, function(data) { 
          strData = JSON.stringify([data])
          console.log('data: ', data);
          var objectid = $('#nota-gestion-detalle-objectid').val();
          var estadoGestion = data.attributes.Estado_gestion
          this.postRequest(this.config.urlBase + this.config.urlKeyNotasDeGestion + '/applyEdits', strData, 'adds').then(
            lang.hitch(this, function(objRes) { 
              console.log('objRes: ', objRes)
              if (objRes.addResults[0].success === true)
              {
                // Actualizo el estado de la SIA.
                var data = {};
                var attributes = {};
                attributes['Dat_SIAs_Estados_Gestion'] = estadoGestion
                attributes['OBJECTID'] = parseInt(objectid);
                data['attributes'] = attributes;
                strData = JSON.stringify([data])

                this.postRequest(this.config.urlBase + this.config.urlKeySias + '/applyEdits', strData, 'updates').then(
                  lang.hitch(this, function(objRes) { 
                    console.log('objRes: ', objRes)
                    if (objRes.updateResults[0].success === true)
                    {
                      showMessage('Nota de gestión ingresada exitosamente');
                      deferred.resolve(objRes);
                    } else {
                      msg = objRes.addResults[0].error.description
                      showMessage('Error al enviar la información: ' + msg, 'error')
                    }
                  }),
                  function(objErr) {
                    deferred.resolve([]);
                  }
                );
              } else {
                msg = objRes.addResults[0].error.description
                showMessage('Error al enviar la información: ' + msg, 'error')
              }
            }),
            function(objErr) {
              deferred.resolve([]);
            }
          );
          return deferred.promise;
        }),
        lang.hitch(this, function(strError) {
          console.log('request failed', strError);
          this.showMessage(strError, 'error')
        })
      );
    },


    getData: function () {
      var deferred = new Deferred();
      var data = {};
      var attributes = {};

      // Valido que se elija una SIA
      var sia_gral = $('#sel-nota-gestion-sia option:selected').val();
      if (sia_gral == '-1' || sia_gral == '')
      {
        deferred.reject('Debe seleccionar una SIA')
      } else {
        attributes['SIAIDGRAL2'] = sia_gral
      }

      //Valido que ingrese la fecha de la solicitud
      var fechaSolicitud = $('#txt-nota-gestion-fecha').val();
      let datetime = new Date(fechaSolicitud).getTime();

      if (fechaSolicitud == '')
      {
        deferred.reject('Debe indicar fecha de la gestión')
      } else {
        attributes['Fecha_Nota'] = datetime;
      }

      //Valido que ingrese el estado de la nota de gestion.
      var estado = $('#sel-nota-gestion-estado-sia option:selected').val()
      if (estado == '-1' || estado == '')
      {
        deferred.reject('Debe seleccionar un estado actual de gestión')
      } else {
        attributes['Estado_gestion'] = estado;
      }

      //Valido que ingrese un comentario
      var comentario = $('#txta-nota-gestion-texto').val()
      if (comentario == '')
      {
        deferred.reject('Debe ingresar una nota de gestión')
      } else {
        attributes['Comentario'] = comentario
      }

      //Valido que ingrese un profesional inco.
      var profesional = $('#sel-nota-gestion-autor option:selected').val()
      if (profesional == '-1' || profesional == '')
      {
        deferred.reject('Debe seleccionar un autor')
      } else {
        attributes['Nombre_apellido'] = profesional;
      }

      var id_sia_gral = $('#nota-gestion-detalle-id-sia').val()
      attributes['SIA_ID_LOCAL'] = id_sia_gral;


      data['attributes'] = attributes;
      deferred.resolve(data);
			return deferred.promise;
    },

    getInfotemplate: function () {
      var html_infotemplate = '<table cellspacing="0" cellpadding="0" style="border: none;"><tbody>'
      html_infotemplate += '<tr><td><b>SIA ID Gral: </b></td>';
      html_infotemplate += '<td>${SIAs_Areas_SIA_ID_Gral}</td></tr>';
      html_infotemplate += '<tr><td><b>EPC: </b></td>';
      html_infotemplate += '<td>${Dat_SIAs_SIA_EPC}</td></tr>';
      html_infotemplate += '<tr><td><b>SIA ID Local: </b></td>';
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

    postRequest: function (url, data, type) {
      try{
        var deferred = new Deferred();
        
        let formData = new FormData();
        formData.append('f', 'json');
        formData.append(type, data);

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


