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
var userToken, userPortal = null;
var editToolbar;
var geometriesKmlEdit = {};
var map, config, resetForm, getRequest, html_infotemplate, gLayer;
define([
  'dojo/_base/declare', 
  'jimu/BaseWidget',
  "jimu/dijit/Message",
  "dojo/Deferred",
  "dojo/_base/lang",
	"dojo/_base/array",
  'esri/layers/GraphicsLayer',
  "esri/graphic",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/Color",
  "esri/InfoTemplate",
  "esri/geometry/Polygon",
  "dojo/_base/event",
  "esri/toolbars/edit",
  "esri/geometry/webMercatorUtils",
  "esri/geometry/geometryEngine",
  'jimu/portalUtils',
  'jimu/portalUrlUtils',
  "./store/ArcGISServerStore.js",
  "dojo/store/Cache",
  "dojo/store/Memory",
  "dojo/when",
  "dijit/form/FilteringSelect", 
],
function(
  declare, 
  BaseWidget, 
  Message,
  Deferred,
  lang,
  arrayUtils,
  GraphicsLayer,
  Graphic,
  SimpleLineSymbol,
  SimpleFillSymbol,
  Color,
  InfoTemplate,
  Polygon,
  event,
  Edit,
  webMercatorUtils,
  geometryEngine,
  portalUtils, 
  portalUrlUtils,
  ArcGISServerStore, 
  Cache,
  Memory, 
  when, 
  FilteringSelect, 
  ){
  return declare(BaseWidget, {
    name: "EditarSia",
    baseClass: 'jimu-widget-editar-sias',
    startup: function(){
      map = this.map;
      config = this.appConfig.Sias;
      getRequest = this.getRequest;
      resetForm = this.resetForm;
      gLayer = new GraphicsLayer({'id': 'gLayerGraphicEditarSia'});
      html_infotemplate = this.getInfotemplate();
      map.addLayer(gLayer);     

      //Obtengo el token del usuario logueado de portal
      this.getUserTokenPortal();

      // Obtengo las sias registradas
      this.loadSias();

      //Obtengo los epc
      this.loadEpc();

      // Obtengo los profesionales inco.
      this.loadProfesionalesInco();

      // Obtengo los solicitantes inco
      this.loadSolicitantesInco();

      $('[data-toggle="popover"]').popover({
        html : true,
        container: 'body'
      });
      // $('[data-toggle="tooltip"]').tooltip();

      editToolbar = new Edit(map);
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
    },

    getUserTokenPortal: function () {
      var portalUrl = portalUrlUtils.getStandardPortalUrl(this.appConfig.portalUrl);
      var portal = portalUtils.getPortal(portalUrl);
      userPortal = portal.user;
      userToken = userPortal.credential.token;
    },

    loadEpc: function () {
      let html = '<option value="-1">[Seleccione]</option>';
      html += '<option value="EPC 1">EPC 1</option>';
      html += '<option value="EPC 2">EPC 2</option>';
      html += '<option value="EPC 3">EPC 3</option>';
      html += '<option value="EPC 4">EPC 4</option>';
      $('#sel-editar-sia-Dat_SIAs_SIA_EPC').html(html)
    },
    
    loadSias: function () {
      // Create ArcGISServerStore
      var agsStore = new ArcGISServerStore({
        url: config.urlBase + config.urlKeySias,
        flatten: true,
        returnGeometry: true,
        outFields: ['*'],
        orderByFields: ['SIAs_Areas_SIA_ID_Gral']
      });

      // Cache store - Prevents extra queries for repeat "get" calls
      var memoryStore = new Memory();
      var store = new Cache(agsStore, memoryStore);

      // Build the FilteringSelect
      var fs = new FilteringSelect({
        store: agsStore,
        name: 'sias',
        searchAttr: 'SIAs_Areas_SIA_ID_Gral',
        placeholder: 'Buscar SIA',
        label: 'el Label',
        style: "display: block;width: 100%;height: calc(1.5em + .75rem + 2px);padding: .375rem .75rem;font-size: 1rem;font-weight: 400;line-height: 1.5;color: #495057;background-color: #fff;background-clip: padding-box;border: 1px solid #ced4da;border-radius: .25rem;transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;margin-top: 5px;",
        required: false,
        hasDownArrow: true,
        pageSize: 15,
        autoComplete: true,
      }, document.getElementById('sel-sia-editar-sia'));

      fs.on('change', function (newValue) {
        when(store.get(newValue)).then(function (data) {
          console.log('sia :', data);
          let id_sia = data.SIAs_Areas_SIA_ID_Gral;
          if(id_sia !== '-1')
          {
            let profesional = data.Resgistrado_por;
            let solicitante = data.ID_Solicitante;

            console.log('id_sia: ', id_sia);
            console.log('profesional: ', profesional);
            console.log('solicitante: ', solicitante);

            $("#sel-profesional-inco-editar-sia").val('-1');
            $("#sel-solicitante-inco-editar-sia").val('-1');
            $("#sel-editar-sia-Dat_SIAs_SIA_EPC").val('-1');

            gLayer.clear();

            if(profesional)
            {
              var query = '/query?outFields=*&where=ID_ProfesionalINCO='+profesional+'&f=pjson';
              getRequest(config.urlBase + config.urlKeyProfesionales + query).then(
                lang.hitch(this, function(response) { 
                  if(response.features.length > 0)
                  {
                    console.log('response: ', response);
                    $("#sel-profesional-inco-editar-sia").val(response.features[0].attributes.ID_ProfesionalINCO)
                  }
                }),
                function(objErr) {
                  console.log('request failed', objErr)
                }
              );
            }

            if(solicitante)
            {
              var query = '/query?outFields=*&where=ID_Solicitante='+solicitante+'&f=pjson';
              getRequest(config.urlBase + config.urlKeySolicitante + query).then(
                lang.hitch(this, function(response) { 
                  if(response.features.length > 0)
                  {
                    console.log('response: ', response);
                    $("#sel-solicitante-inco-editar-sia").val(response.features[0].attributes.ID_Solicitante)
                  }
                }),
                function(objErr) {
                  console.log('request failed', objErr)
                }
              );
            }

            let geom = data.geometry
            var d = new Date(data.Dat_SIAs_Fecha_Solicitud)
            var options = {  dateStyle: 'medium' };
            var datetime = d.toLocaleString("es-CL", options);

            $("#input-editar-sia-Dat_SIAs_Id_Sistema").val(data.Dat_SIAs_Id_Sistema);
            $("#sel-editar-sia-Dat_SIAs_SIA_EPC").val(data.Dat_SIAs_SIA_EPC);
            $("#input-editar-sia-Dat_SIAs_SIA_ID_LOCAL").val(data.Dat_SIAs_SIA_ID_LOCAL);
            $("#input-editar-sia-Dat_SIAs_SIA_IDE_Etiq").val(data.Dat_SIAs_SIA_IDE_Etiq);
            $("#input-editar-sia-Dat_SIAs_SIAIDGRAL2").val(data.Dat_SIAs_SIAIDGRAL2);
            $("#input-editar-sia-Dat_SIAs_Area_Solicitada").val(data.Dat_SIAs_Area_Solicitada);
            $("#input-editar-sia-Dat_SIAs_Comentario").val(data.Dat_SIAs_Comentario);
            $("#input-editar-sia-Dat_SIAs_SIA_Origen").val(data.Dat_SIAs_SIA_Origen);
            $("#input-editar-sia-SIAs_Areas_Area_m2").val(data.SIAs_Areas_Area_m2);
            $("#input-editar-sia-OBJECTID").val(data.OBJECTID);

            (data.Modifica_Ingenieria)?$('#chk-editar-sia-Modifica_Ingenieria').prop('checked', true):$('#chk-editar-sia-Modifica_Ingenieria').prop('checked', false);
            (data.Modifica_Area_RCA)?$('#chk-editar-sia-Modifica_Area_RCA').prop('checked', true):$('#chk-editar-sia-Modifica_Area_RCA').prop('checked', false);
            (data.OIA_no_descrita_RCA)?$('#chk-editar-sia-OIA_no_descrita_RCA').prop('checked', true):$('#chk-editar-sia-OIA_no_descrita_RCA').prop('checked', false);

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

            var infoTemplate = new InfoTemplate("SIA", html_infotemplate);
            var polygon = new Polygon(geom);
            var graphic = new Graphic(polygon, sfs, attr, infoTemplate);
            gLayer.add(graphic);
            map.setExtent(polygon.getExtent(), true);
           
          }else{
            resetForm();
          }
        });
      });
    },

    loadProfesionalesInco: function () {
      var query = '/query?outFields=*&where=1%3D1&f=pjson';
      this.getRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeyProfesionales + query).then(
        lang.hitch(this, function(response) { 
          if(response.features.length > 0)
          {
            let html = '<option value="-1">[Seleccione]</option>';
            html += response.features.map(function (f) {
              return '<option value="' + f.attributes.ID_ProfesionalINCO + '">' + f.attributes.Nombre_apellido + '</option>';
            });
            $('#sel-profesional-inco-editar-sia').html(html)
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
            $('#sel-solicitante-inco-editar-sia').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );
    },

    resetForm: function () {
      $(':input').not(':button, :submit, :checkbox, :reset, :radio').val("");
      $(':checkbox').prop('checked', false);
      $("#sel-sia-editar-sia").val("-1");
      $("#sel-profesional-inco-editar-sia").val("-1");
      $("#sel-solicitante-inco-editar-sia").val("-1");
      $("#sel-editar-sia-Dat_SIAs_SIA_EPC").val("-1");
    },

    _onclickGuardarEdicion: function () {
      this.getData().then(
        lang.hitch(this, function(data) { 
          console.log('data: ', data);
          // return;
          let geom = data.attr_sia['geometry'];
          var polygon = new Polygon(geom);
          var strData = JSON.stringify([data.attr_sia])
          this.postRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeySias + '/updateFeatures', strData, 'features').then(
            lang.hitch(this, function(objRes) { 
              if (objRes.updateResults[0].success === true)
              {
                //Refresco la capa de sias.
                if (typeof featureLayerSias !== 'undefined') {
                  featureLayerSias.refresh();
                }
                this.showMessage('Sia actualizada exitosamente');
                // this.resetForm();
                editToolbar.deactivate();
                var gLayer = this.map.getLayer("gLayerGraphicEditarSia");
                gLayer.clear();
                this.map.setExtent(polygon.getExtent(), true)
              } else {
                msg = objRes.updateResults[0].error.description
                this.showMessage('Error al enviar la información: ' + msg, 'error')
              }
            }),
            function(objErr) {
              this.showMessage('Error al enviar la información: ' + objErr, 'error')
              console.log('request failed', objErr);
            }
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
      var attributes = {};

      console.log('geometriesKmlEdit: ', geometriesKmlEdit);

      // Valido que se elija una sia
      // var SIAs_Areas_SIA_ID_Gral = $('#sel-sia-editar-sia option:selected').val();
      var SIAs_Areas_SIA_ID_Gral = $('#sel-sia-editar-sia').val();
      if (SIAs_Areas_SIA_ID_Gral == '-1' || SIAs_Areas_SIA_ID_Gral == '')
      {
        deferred.reject('Debe seleccionar una sia');
      } else {
        attributes['SIAs_Areas_SIA_ID_Gral'] = SIAs_Areas_SIA_ID_Gral;
      }

      // Compruebo si se seleccionó una capa (kml) cargada desde el widget "añadir datos"
      if(geometriesKmlEdit.hasOwnProperty('rings'))
      {
        dataSIa['geometry'] = geometriesKmlEdit.toJson();
      }else{
        // Valido que exista al menos una geometría dibujada en el mapa.
        var geom = [];
        var gLayer = this.map.getLayer("gLayerGraphicEditarSia");
        if (gLayer.graphics.length === 0)
        {
          deferred.reject('Debe seleccionar al menos un polígono')
        } else {
          arrayUtils.forEach(gLayer.graphics, function(f) {
            // console.log('f.geometry: ', f.geometry);
            // var geometry = webMercatorUtils.webMercatorToGeographic(f.geometry);
            // console.log('geometry: ', geometry);
            geom.push(f.geometry);
          }, this);
          var union = geometryEngine.union(geom);
          dataSIa['geometry'] = union.toJson();
        }
      }

      // Valido que se elija un profesional inco
      var profesional_inco = $('#sel-profesional-inco-editar-sia option:selected').val();
      if (profesional_inco == '-1' || profesional_inco == '')
      {
        deferred.reject('Debe seleccionar un profesional INCO');
      } else {
        attributes['Resgistrado_por'] = profesional_inco
      }

      // Valido que se elija un solicitante
      var solicitante_inco = $('#sel-solicitante-inco-editar-sia option:selected').val();
      if (solicitante_inco == '-1' || solicitante_inco == '')
      {
        deferred.reject('Debe seleccionar un solicitante');
      } else {
        attributes['ID_Solicitante'] = solicitante_inco;
      }

      //Valido que ingrese una epc
      var epc = $('#sel-editar-sia-Dat_SIAs_SIA_EPC option:selected').val()
      if (epc == '-1' || epc == '')
      {
        deferred.reject('Debe seleccionar una EPC')
      } else {
        attributes['Dat_SIAs_SIA_EPC'] = epc
      }

      var Dat_SIAs_Id_Sistema = $("#input-editar-sia-Dat_SIAs_Id_Sistema").val();
      if(Dat_SIAs_Id_Sistema !== '')
      {
        attributes['Dat_SIAs_Id_Sistema'] = parseInt(Dat_SIAs_Id_Sistema);
      }else{
        attributes['Dat_SIAs_Id_Sistema'] = null;
      }

      var SIAs_Areas_Area_m2 = $("#input-editar-sia-SIAs_Areas_Area_m2").val();
      if(SIAs_Areas_Area_m2 !== '')
      {
        attributes['SIAs_Areas_Area_m2'] = parseInt(SIAs_Areas_Area_m2);
      }else{
        attributes['SIAs_Areas_Area_m2'] = null;
      }

      attributes['Dat_SIAs_SIA_ID_LOCAL'] = $("#input-editar-sia-Dat_SIAs_SIA_ID_LOCAL").val();
      attributes['Dat_SIAs_SIA_IDE_Etiq'] = $("#input-editar-sia-Dat_SIAs_SIA_IDE_Etiq").val();
      attributes['Dat_SIAs_SIAIDGRAL2'] = $("#input-editar-sia-Dat_SIAs_SIAIDGRAL2").val();
      attributes['Dat_SIAs_Area_Solicitada'] = $("#input-editar-sia-Dat_SIAs_Area_Solicitada").val();
      attributes['Dat_SIAs_Comentario'] = $("#input-editar-sia-Dat_SIAs_Comentario").val();
      attributes['Dat_SIAs_SIA_Origen'] = $("#input-editar-sia-Dat_SIAs_SIA_Origen").val();
      attributes['OBJECTID'] = parseInt($("#input-editar-sia-OBJECTID").val());
  
      // “Modifica_Ingenieria”, “Modifica_Area_RCA” y “Describe_Cambio_RCA”.

      // La columna a añadir para almacenar la respuesta a la pregunta nueva debería llamarse “OIA_no_descrita_RCA”, 
      // o algo similar, de tipo binario
      
      // Describe_Cambio_RCA: este campo nosé donde se llena, no se está ocupando.
      attributes['Modifica_Ingenieria'] = ($('#chk-editar-sia-Modifica_Ingenieria').is(':checked')) ? 1 : 0;
      attributes['Modifica_Area_RCA'] = ($('#chk-editar-sia-Modifica_Area_RCA').is(':checked')) ? 1 : 0;
      attributes['OIA_no_descrita_RCA'] = ($('#chk-editar-sia-OIA_no_descrita_RCA').is(':checked')) ? 1 : 0;

      dataSIa['attributes'] = attributes;
      data['attr_sia'] = dataSIa;
      console.log('data: ', data);
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
      console.log('userToken: ', userToken);
      try{
        var deferred = new Deferred();
        fetch(url + '&token=' + userToken)
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
        formData.append('token', userToken);

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
      console.log('this.map: ', this.map);

      var map = this.map;
      var existenCapas = false;
      var geom = [];
      var html = '';

      $("#tr-capas-cargadas-editar-sia").hide();
      $("#span-capas-cargadas-editar-sia").html('');

      arrayUtils.forEach(map.layerIds, function(aLayerId) {
        var gLayer = map.getLayer(aLayerId);
        var name = gLayer.name;
        console.log('gLayer: ', gLayer);
        console.log('name: ', name);
        // console.log('type: ', typeof(name));
        // console.log('type: ', typeof(name));
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
        $("#tr-capas-cargadas-editar-sia").show();
        $("#span-capas-cargadas-editar-sia").html(html);
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
          geometriesKmlEdit = geometryEngine.union(geom);
        }else{
          console.log('sin clic');
          geometriesKmlEdit = {};
        }
      });
    },

    onClose: function () {
      console.log('onClose');
      var gLayer = this.map.getLayer("gLayerGraphicEditarSia");
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


