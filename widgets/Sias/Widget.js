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
  $){
  return declare(BaseWidget, {
    name: 'Sias',
    sias: null,
    geometryService: null,

    startup: function(){
      var map = this.map;
      var message = this.showMessage
      var config = this.config.sias
      var getRequest = this.getRequest

      var gLayer = new GraphicsLayer({'id': 'gLayerGraphic'});
      map.addLayer(gLayer);

      this.geometryService = new GeometryService(config.geometryServiceUrl);
      
      var editToolbar = new Edit(map);
      var editingEnabled = false;
      gLayer.on("dbl-click", function(evt) {
        event.stop(evt);
        if (editingEnabled === false) {
          editingEnabled = true;
          editToolbar.activate(Edit.EDIT_VERTICES , evt.graphic);
        } else {
          currentLayer = this;
          editToolbar.deactivate();
          editingEnabled = false;
        }
      });

      gLayer.on("click", function(evt) {
        event.stop(evt);
        if (evt.ctrlKey === true || evt.metaKey === true) {  //delete feature if ctrl key is depressed
          editToolbar.deactivate();
          gLayer.remove(evt.graphic)
          editingEnabled=false;
        }
      });

      editToolbar.on("vertex-move-stop", lang.hitch(this, function(evt) {
				// this.despliegaAreaPerimetro(evt.graphic.geometry);
			}));

      // Obtengo los profesionales inco
      var query = '/query?outFields=*&returnGeometry=true&where=1%3D1&f=pjson'
      getRequest(config.urlBase + config.urlKeyProfesionales + query).then(
        lang.hitch(this, function(objRes) { 
          if(objRes.features.length > 0)
          {
            var html = '<option value="-1">[Seleccione]</option>';
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
            var html = '<option value="-1">[Seleccione]</option>';
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
    },

    _onclickEnviar: function () {
      var deferred = new Deferred();

      this.getData().then(
        lang.hitch(this, function(data) { 
          strData = JSON.stringify([data])
          this.postRequest(this.config.sias.urlBase + this.config.sias.urlKeySias + '/applyEdits', strData).then(
            lang.hitch(this, function(objRes) { 
              console.log('objRes: ', objRes)
              if (objRes.addResults[0].success === true)
              {
                this.showMessage('Sia ingresada exitosamente')
                deferred.resolve(objRes);
              } else {
                msg = objRes.addResults[0].error.description
                this.showMessage('Error al enviar la información: ' + msg, 'error')
              }
            }),
            function(objErr) {
              deferred.resolve([]);
            }
          )
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
      attributes = {};

      // Valido que se elija un profesional inco
      var profesional_inco = $('#sel-sia-profesional-inco option:selected').val();
      if (profesional_inco == '-1' || profesional_inco == '')
      {
        deferred.reject('Debe seleccionar un profesional INCO')
      } else {
        // attributes['Resgistrado_por'] = $('#sel-sia-profesional-inco option:selected').text();
        attributes['Resgistrado_por'] = profesional_inco
      }

      // Valido que se elija un solicitante
      var solicitante_inco = $('#sel-sia-solicitante-inco option:selected').val();
      if (solicitante_inco == '-1' || solicitante_inco == '')
      {
        deferred.reject('Debe seleccionar un solicitante');
      } else {
        // attributes['ID_Solicitante'] = $('#sel-sia-solicitante-inco option:selected').text();
        attributes['ID_Solicitante'] = solicitante_inco
      }

      //Valido que ingrese una epc
      var epc = $('#sel-sia-epc option:selected').val()
      if (epc == '-1' || epc == '')
      {
        deferred.reject('Debe seleccionar una EPC')
      } else {
        attributes['Dat_SIAs_SIA_EPC'] = $('#sel-sia-epc option:selected').text()
      }

      //Valido que ingrese la fecha de la solicitud
      var fechaSolicitud = $('#txt-sia-fecha-solicitud').val();
      let datetime = new Date(fechaSolicitud).getTime();

      if (fechaSolicitud == '')
      {
        deferred.reject('Debe seleccionar una fecha de solicitud')
      } else {
        attributes['Dat_SIAs_Fecha_Solicitud'] = datetime;
      }

      //Valido que ingrese una id sia
      var idSia = $('#txt-sia-id-sia').val()
      if (idSia == '')
      {
        deferred.reject('Debe ingresar un ID SIA')
      } else {
        attributes['Dat_SIAs_Id_Sistema'] = idSia
      }

      //Valido que ingrese un area solicitada
      var areaSol = $('#txta-sia-area-sol').val()
      if (areaSol == '')
      {
        deferred.reject('Debe ingresar un area solicitada')
      } else {
        attributes['Dat_SIAs_Area_Solicitada'] = areaSol
      }



      // Valido que haya al menos una geometría
      var geom = []
      var gLayer = this.map.getLayer("gLayerGraphic");
      if (gLayer.graphics.length === 0)
      {
        deferred.reject('Debe dibujar al menos un polígono')
      } else {
        arrayUtils.forEach(gLayer.graphics, function(f) {
          var geometry = webMercatorUtils.webMercatorToGeographic(f.geometry);
          geom.push(geometry)
        }, this);
        var union = geometryEngine.union(geom);
        data['geometry'] = union.toJson()
      }

      // deferred.reject('Jajajajajjaja')

      data['attributes'] = attributes;
      deferred.resolve(data);
			return deferred.promise;
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

    _onclickDraw: function () {
      var gLayer = this.map.getLayer("gLayerGraphic");
      $("#btn-draw").addClass('active');
      this.map.disableMapNavigation();
      tb = new Draw(this.map);
      tb.activate("polygon");
      tb.on("draw-end", dojo.hitch(null, this.addGraphic, tb));
    },

    addGraphic: function (tb, evt) {
      var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
        new Color([255,0,0]), 2),new Color([255,255,0,0.25])
      );

      var gLayer = this.map.getLayer("gLayerGraphic");
      var graphic = new Graphic(evt.geometry, sfs);
      gLayer.add(graphic);

      $("#btn-draw").removeClass('active');
      tb.deactivate();
      this.map.enableMapNavigation();
    },

    despliegaAreaPerimetro: function(graphic) {
      this.calculaAreaPerimetro(graphic).then(
        lang.hitch(this, function(resp) {
          this.divArea.innerHTML = number.format(resp.area);
          this.divPerimetro.innerHTML = number.format(resp.perimetro);
        })
      );
    },

    calculaAreaPerimetro: function(geometria) {
			var deferred = new Deferred();
			var areasAndLengthParams = new AreasAndLengthsParameters();
			areasAndLengthParams.lengthUnit = GeometryService.UNIT_METER;
			areasAndLengthParams.areaUnit = GeometryService.UNIT_SQUARE_METERS;
			areasAndLengthParams.polygons = [geometria];
			areasAndLengthParams.calculationType = "preserveShape";
			this.geometryService.areasAndLengths(areasAndLengthParams, 
				function(evtObj) {
					deferred.resolve({
						'area':evtObj.areas[0].toFixed(0), 
						'perimetro':evtObj.lengths[0].toFixed(0)
					})
				}, 
				function() {
					deferred.resolve({'area':"", 'perimetro':""})
				}
			);
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

      var gLayer = this.map.getLayer("gLayerGraphic");
			gLayer.clear();
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


