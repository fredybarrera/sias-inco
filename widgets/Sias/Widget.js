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
var VerGestion, featureLayerSias;
var geometriesKml = {};
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
  "esri/InfoTemplate",
  "esri/geometry/Polygon"
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
  InfoTemplate,
  Polygon){
  return declare(BaseWidget, {
    name: 'Ingresar nueva SIA',
    sias: null,
    geometryService: null,
    baseClass: 'jimu-widget-sias',

    startup: function(){
      var map = this.map;
      var config = this.appConfig.Sias

      // Obtengo los profesionales inco
      this.loadProfesionalesInco();

      // Obtengo los solicitantes inco
      this.loadSolicitantesInco();

      //Obtengo las sias de origen
      this.loadSiasOrigen();

      //Obtengo los estados de gestión.
      this.loadEstadosGestion();

      //Cargo la capa de SIAS en el mapa.
      this.loadLayerSias();

      //Layer para los polígonos de una nueva sia, dibujados desde el widget.
      var gLayer = new GraphicsLayer({'id': 'gLayerGraphic'});
      map.addLayer(gLayer);

      dojo.connect(featureLayerSias, "onClick", function(evt) {
        $(".esriPopup").css({ 'z-index': 40 });
        $(".esriPopup").removeClass("esriPopupHidden").addClass("esriPopupVisible");
      });

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
        //delete feature if ctrl key is depressed
        if (evt.ctrlKey === true || evt.metaKey === true) {  
          editToolbar.deactivate();
          gLayer.remove(evt.graphic)
          editingEnabled=false;
        }
      });

      editToolbar.on("vertex-move-stop", lang.hitch(this, function(evt) {
				// this.despliegaAreaPerimetro(evt.graphic.geometry);
			}));
    },

    loadLayerSias: function () {
      var htmlInfoTemplate = this.getHtmlInfotemplate();
      VerGestion = this._onclickVerGestion;
      var infoTemplate = new InfoTemplate("SIA", htmlInfoTemplate);  
      featureLayerSias = new esri.layers.FeatureLayer(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeySias, {
        mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
        infoTemplate: infoTemplate,
        outFields: ["*"]
      });
      featureLayerSias.setOpacity(0.5);
      this.map.addLayer(featureLayerSias);
    },

    loadProfesionalesInco: function () {
      var query = '/query?outFields=*&returnGeometry=true&where=1%3D1&orderByFields=Apellidos&f=pjson'
      this.getRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeyProfesionales + query).then(
        lang.hitch(this, function(response) { 
          if(response.features.length > 0)
          {
            var html = '<option value="-1">[Seleccione]</option>';
            html += response.features.map(function (f) {
              return '<option value="' + f.attributes.ID_ProfesionalINCO + '">' + f.attributes.Nombre_apellido + '</option>';
            });
            $('#sel-sia-profesional-inco').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );
    },

    loadSolicitantesInco: function () {
      var query = '/query?outFields=*&returnGeometry=true&where=1%3D1&orderByFields=Apellidos&f=pjson'
      this.getRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeySolicitante + query).then(
        lang.hitch(this, function(response) { 
          if(response.features.length > 0)
          {
            let html = '<option value="-1">[Seleccione]</option>';
            html += response.features.map(function (f) {
              return '<option value="' + f.attributes.ID_Solicitante + '">[' + f.attributes.Empresa + '] ' + f.attributes.Apellidos + ', ' + f.attributes.Nombres + '</option>';
            });
            $('#sel-sia-solicitante-inco').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );
    },

    loadSiasOrigen: function () {
      var query = '/query?outFields=Dat_SIAs_SIAIDGRAL2&returnGeometry=false&where=1%3D1&orderByFields=Dat_SIAs_SIAIDGRAL2&f=pjson'
      this.getRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeySias + query).then(
        lang.hitch(this, function(response) { 
          if(response.features.length > 0)
          {
            let html = '<option value=""></option>';
            html += response.features.map(function (f) {
              return '<option value="' + f.attributes.Dat_SIAs_SIAIDGRAL2 + '">' + f.attributes.Dat_SIAs_SIAIDGRAL2 + '</option>';
            });
            $('#sel-nuevasia-sia-origen').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );
    },

    loadEstadosGestion: function () {
      var query = '/query?outFields=*&where=1%3D1&f=pjson';
      this.getRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeyEstadoGestion + query).then(
        lang.hitch(this, function(response) { 
          if(response.features.length > 0)
          {
            let html = '<option value="-1">[Seleccione]</option>';
            html += response.features.map(function (f) {
              return '<option value="' + f.attributes.Estados_Gestion + '">' + f.attributes.Estados_Gestion + '</option>';
            });
            $('#sel-sia-estado_gestion').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );
    },

    getHtmlInfotemplate: function () {
        let html_infotemplate = "";
        html_infotemplate += "<table class='table table-sm'>";
        html_infotemplate += "<tbody><tr><td>ID SIA General:</td><td>${SIAs_Areas_SIA_ID_Gral}</td></tr>";
        html_infotemplate += "<tr><td>EPC:</td><td>${Dat_SIAs_SIA_EPC}</td></tr>";
        html_infotemplate += "<tr><td>Area solicitada:</td><td>${Dat_SIAs_Area_Solicitada}</td></tr>";
        html_infotemplate += "<tr><td>Fecha solicitud:</td><td>${Dat_SIAs_Fecha_Solicitud}</td></tr>";
        html_infotemplate += "<tr><td>Estado gestión:</td><td>${Dat_SIAs_Estados_Gestion}</td></tr>";
        html_infotemplate += "<tr><td>Comentario:</td><td>${Dat_SIAs_Comentario}</td></tr>";
        html_infotemplate += "<tr><td>SIA Origen:</td><td>${Dat_SIAs_SIA_Origen}</td></tr>";
        html_infotemplate += "<tr><td colspan='2'>";
        html_infotemplate += "<input type='button' id='botonVerGestion' class='btn btn-primary btn-sm' value='Ver gestión' onclick='VerGestion("+'"'+"${SIAs_Areas_SIA_ID_Gral}|${OBJECTID}"+'"'+");'>";
        html_infotemplate += "</td></tr></tbody></table>";
      return html_infotemplate;
    },

    _onclickVerGestion: function (data) {
      var aux = data.split("|");
      var id_sia_general = aux[0];
      id_sia_general;
      console.log('_onclickVerGestion id_sia_general: ', id_sia_general);
      var panelIsVisible = $("#_35_panel").is(":visible");
      console.log('_onclickVerGestion panelIsVisible: ', panelIsVisible);

      if(panelIsVisible)
      {
        $("#sel-nota-gestion-sia").val(id_sia_general)
        $("#sel-nota-gestion-sia").change();
      }else{
        $("#dijit__WidgetBase_1").click();
        const timeValue = setInterval((interval) => {
          console.log('acaaa');
          console.log($("#_35_panel").is(":visible"));
          if($("#_35_panel").is(":visible"))
          {
            $("#sel-nota-gestion-sia").val(id_sia_general)
            $("#sel-nota-gestion-sia").change();
            clearInterval(timeValue);
          }
        }, 1000); //Cada medio segundos
      }

      $(".esriPopup").removeClass("esriPopupVisible").addClass("esriPopupHidden");
      $(".esriPopup").css({ 'z-index': -40 });
    },

    _onclickEnviar: function () {
      this.getData().then(
        lang.hitch(this, function(data) { 
          let geom = data.attr_sia['geometry'];
          var polygon = new Polygon(geom);
          this.validaIdSia().then(
            lang.hitch(this, function(resp) { 
              var strData = JSON.stringify([data.attr_sia])
              this.postRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeySias + '/applyEdits', strData).then(
                lang.hitch(this, function(objRes) { 
                  if (objRes.addResults[0].success === true)
                  {
                    var strData = JSON.stringify([data.attr_nota_gestion])
                    this.postRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeyNotasDeGestion + '/applyEdits', strData).then(
                      lang.hitch(this, function(objRes) { 
                        if (objRes.addResults[0].success === true)
                        {
                          featureLayerSias.refresh();
                          this.showMessage('Sia ingresada exitosamente');
                          this.resetForm();
                          var gLayer = this.map.getLayer("gLayerGraphic");
                          gLayer.clear();
                          this.map.setExtent(polygon.getExtent(), true)
                        } else {
                          msg = objRes.addResults[0].error.description
                          this.showMessage('Error al enviar la información: ' + msg, 'error')
                        }
                      }),
                      function(objErr) {
                        this.showMessage('Error al enviar la información: ' + objErr, 'error')
                        console.log('request failed', objErr);
                      }
                    );
                  } else {
                    msg = objRes.addResults[0].error.description
                    this.showMessage('Error al enviar la información: ' + msg, 'error')
                  }
                }),
                function(objErr) {
                  this.showMessage('Error al enviar la información: ' + objErr, 'error')
                  console.log('request failed', objErr);
                }
              )
            }),
            lang.hitch(this, function(strError) {
              console.log('request failed', strError);
              this.showMessage(strError, 'error')
            })
          );
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
      var dataSIa = {};
      var dataGestion = {};
      var attributes = {};
      var attributesGestion = {}

      console.log('geometriesKml: ', geometriesKml);

      // Compruebo si se seleccionó una capa (kml) cargada desde el widget "añadir datos"
      if(geometriesKml.hasOwnProperty('rings'))
      {
        dataSIa['geometry'] = geometriesKml.toJson();
      }else{
        // Valido que exista al menos una geometría dibujada en el mapa.
        var geom = [];
        var gLayer = this.map.getLayer("gLayerGraphic");
        if (gLayer.graphics.length === 0)
        {
          deferred.reject('Debe dibujar al menos un polígono')
        } else {
          arrayUtils.forEach(gLayer.graphics, function(f) {
            var geometry = webMercatorUtils.webMercatorToGeographic(f.geometry);
            geom.push(geometry);
          }, this);
          var union = geometryEngine.union(geom);
          dataSIa['geometry'] = union.toJson();
        }
      }

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
        attributes['Dat_SIAs_SIA_EPC'] = epc
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
      var idSia = $('#txt-sia-id-sia').val().toUpperCase();
      var id_sia_general = "";
      var sia_etiqueta = "";
      if (idSia == '')
      {
        deferred.reject('Debe ingresar un ID SIA')
      } else {
        id_sia_general = epc + '- ' + idSia;
        sia_etiqueta = idSia.replace("SIA", "");
        attributes['Dat_SIAs_SIA_ID_LOCAL'] = idSia;
        attributes['Dat_SIAs_SIAIDGRAL2'] = id_sia_general;
        attributes['SIAs_Areas_SIA_ID_Gral'] = id_sia_general;
        attributes['Dat_SIAs_SIA_IDE_Etiq'] = sia_etiqueta.trim();
      }

      attributes['Dat_SIAs_SIA_Origen'] = $('#sel-nuevasia-sia-origen option:selected').val();


      //Valido que ingrese un area solicitada
      var areaSol = $('#txta-sia-area-sol').val()
      if (areaSol == '')
      {
        deferred.reject('Debe ingresar un area solicitada')
      } else {
        attributes['Dat_SIAs_Area_Solicitada'] = areaSol
      }


      // Nota de gestion
      //Valido que ingrese un estado de gestión
      var estado_gestion = $('#sel-sia-estado_gestion option:selected').val()
      if (estado_gestion == '-1' || estado_gestion == '')
      {
        deferred.reject('Debe seleccionar un estado actual de gestión')
      } else {
        attributesGestion['Estado_gestion'] = estado_gestion;
        attributes['Dat_SIAs_Estados_Gestion'] = estado_gestion;
      }

      //Valido que ingrese un comentario en el estado de la gestion actual
      var comentario = $('#txta-sia-comentario').val();
      if (comentario == '')
      {
        deferred.reject('Debe ingresar comentario en el estado de la gestion actual');
      } else {
        attributesGestion['Comentario'] = comentario;
      }


      // “Modifica_Ingenieria”, “Modifica_Area_RCA” y “Describe_Cambio_RCA”.

      // La columna a añadir para almacenar la respuesta a la pregunta nueva debería llamarse “OIA_no_descrita_RCA”, 
      // o algo similar, de tipo binario
      
      // Describe_Cambio_RCA: este campo nosé donde se llena, no se está ocupando.
      attributes['Modifica_Ingenieria'] = ($('#chk-modificacion').is(':checked')) ? 1 : 0;
      attributes['Modifica_Area_RCA'] = ($('#chk-area').is(':checked')) ? 1 : 0;
      attributes['OIA_no_descrita_RCA'] = ($('#chk-no-declarada').is(':checked')) ? 1 : 0;

      attributesGestion['SIAIDGRAL2'] = id_sia_general;
      attributesGestion['Fecha_Nota'] = datetime;
      attributesGestion['Nombre_apellido'] = $('#sel-sia-profesional-inco option:selected').text();
      attributesGestion['SIA_ID_LOCAL'] = idSia;
      attributesGestion['SIA_IDE_Etiq'] = sia_etiqueta.trim();

      // Id_Sistema: 468
      // Area_Solicitada: Adicionales Statcom
      // Datos_Adjuntos: 1435
      // Estado_gestion2: null

      dataSIa['attributes'] = attributes;
      data['attr_sia'] = dataSIa;
      dataGestion['attributes'] = attributesGestion
      data['attr_nota_gestion'] = dataGestion
      
      console.log('data: ', data);
      deferred.resolve(data);
      return deferred.promise;
    },

    resetForm: function () {
      $(':input').not(':button, :submit, :reset, :checkbox, :radio').val("");
      $(':checkbox, :radio').prop('checked', false);
      $("#sel-sia-profesional-inco").val("-1");
      $("#sel-sia-solicitante-inco").val("-1");
      $("#sel-sia-epc").val("-1");
      $("#sel-nuevasia-sia-origen").val("");
      $("#sel-sia-estado_gestion").val("-1");
    },

    validaIdSia: function () {
      var deferred = new Deferred();
      var idSia = $('#txt-sia-id-sia').val().toUpperCase();
      var epc = $('#sel-sia-epc option:selected').val()
      id_sia_general = epc + '- ' + idSia;
      console.log('id_sia_general: ', id_sia_general);

      //Valido que el id de la sia no exista previamente en la capa.
      var query = '/query?returnCountOnly=true&where=SIAs_Areas_SIA_ID_Gral=\'' + id_sia_general + '\'&f=pjson';
      this.getRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeySias + query).then(
        lang.hitch(this, function(objRes) { 
          if (objRes.count !== 0)
          {
            console.log('reject')
            deferred.reject('Ya existe una sia con el ID ' + id_sia_general);
          } else {
            console.log('resolve')
            deferred.resolve([]);
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
          deferred.reject(objErr);
        }
      );
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
            deferred.reject(error);
          }
        );
      } catch(err) {
        console.log('request failed', err)
				deferred.reject(err);
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
      console.log('this.map: ', this.map);

      var map = this.map;
      var existenCapas = false;
      var geom = [];
      var html = '';

      arrayUtils.forEach(map.layerIds, function(aLayerId) {
        var gLayer = map.getLayer(aLayerId);
        var name = gLayer.name;
        if (name !== undefined && name.search(".kml") !== -1)
        // if(gLayer.id !== "defaultBasemap" && gLayer.id !== "gLayerGraphic" && gLayer.name !== undefined)
        {
          existenCapas = true;
          console.log('glayer layerIds: ', gLayer);
          html += `<div class="form-check" style="margin-bottom: 8px;font-size: 13px;margin-top: 10px;">
            <input type="checkbox" class="form-check-input" name="chk-capas-cargadas" value="${gLayer.id}" style="top: -3px;">
            <label class="form-check-label" for="${name}">${name}</label>
          </div>`;
        }
      }, this);

      if(existenCapas)
      {
        $("#contenedor-capas-cargadas").show();
        $("#span-capas-cargadas").html(html);
      }

      $("input[name='chk-capas-cargadas']").on('change', function() {
        $("input[name='chk-capas-cargadas']").not(this).prop('checked', false);
        if ($(this).is(':checked')) {
          var LayerId = $(this).val();
          var gLayer = map.getLayer(LayerId);
          geom = [];
          if(gLayer._fLayers.length > 0)
          {
            existenCapas = true;
            arrayUtils.forEach(gLayer._fLayers, function(layer) {
              map.setExtent(layer.fullExtent, true)
              if(layer.graphics.length > 0)
              {
                arrayUtils.forEach(layer.graphics, function(g) {
                  if(g.geometry.rings.length > 0 && g.geometry.rings[0].length > 0)
                  {
                    var geometry = webMercatorUtils.webMercatorToGeographic(g.geometry);
                    geom.push(geometry);
                  }
                }, this);
              }
            }, this);
          }
          geometriesKml = geometryEngine.union(geom);
        }else{
          console.log('sin clic');
          geometriesKml = {};
        }
      });
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
