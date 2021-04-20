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
var userToken = null;
var userPortal = null;
var map, message, config, getRequest, html_infotemplate, gLayer, fs;
var getHistorialSia, getUltimaGestion;
var statusGeneralSia, statusEspecificoSia;
define([
  "dojo/_base/declare", 
  "dojo/dom",
  "jimu/dijit/Message",
  "dojo/Deferred",
  "dojo/_base/lang",
	"dojo/_base/array",
	"dojo/json",
  "jimu/BaseWidget",
  "esri/graphic",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/Color",
  'esri/layers/GraphicsLayer',
  "esri/geometry/Polygon",
  "esri/InfoTemplate", 
  'jimu/portalUtils',
  'jimu/portalUrlUtils',
  "./store/ArcGISServerStore.js",
  "dojo/store/Cache",
  "dojo/store/Memory",
  "dojo/when",
  "dijit/form/FilteringSelect", 
  'esri/tasks/query',
	'esri/tasks/QueryTask',
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
  Graphic,
  SimpleLineSymbol,
  SimpleFillSymbol,
  Color,
  GraphicsLayer,
  Polygon,
  InfoTemplate,
  portalUtils, 
  portalUrlUtils,
  ArcGISServerStore, 
  Cache,
  Memory, 
  when, 
  FilteringSelect, 
  Query,
	QueryTask,
  ){
  return declare(BaseWidget, {
    name: 'Notas de gestión',
    sias: null,
    startup: function(){
      this.inherited(arguments);
      map = this.map;
      message = this.showMessage
      config = this.appConfig.Sias
      statusGeneralSia = this.appConfig.statusGeneralSia;
      statusEspecificoSia = this.appConfig.statusEspecificoSia;
      getRequest = this.getRequest
      html_infotemplate = this.getInfotemplate();
      gLayer = new GraphicsLayer({'id': 'gLayerGraphicNotas'});
      map.addLayer(gLayer);

      getHistorialSia = this.getHistorialSia;
      getUltimaGestion = this.getUltimaGestion;

      //Obtengo el token del usuario logueado de portal
      this.getUserTokenPortal();

      // Obtengo las sias registradas en el sistema.
      this.loadSias();

      // Obtengo los estados de gestión.
      this.loadEstadosGestion();
      
      // Obtengo los profesionales inco.
      this.loadProfesionalesInco();

      $('#sel-nota-gestion-estado-sia').change(function() {
        let notaGestion = $(this).val();
        if(notaGestion === 'Aprobada')
        {
          $("#tr-fecha-intervencion").show();// Fecha_Desmovilizacion_Plan
          $("#tr-fecha-desmovilizacion").show();// Fecha_InicioIntervencion_Plan
        }else{
          $("#tr-fecha-intervencion").hide();
          $("#tr-fecha-desmovilizacion").hide();
        }

        if(notaGestion == 'Desmovilizada')
        {
          $("#tr-fecha-real-desmovilizacion").show();// Fecha_Desmovilizacion_Real

        }else{
          $("#tr-fecha-real-desmovilizacion").hide();
        }

        if(notaGestion == 'Construcción iniciada')
        {
          $("#tr-fecha-real-intervencion").show();// Fecha_InicioIntervencion_Real

        }else{
          $("#tr-fecha-real-intervencion").hide();
        }
      });//change
    },

    getUserTokenPortal: function () {
      var portalUrl = portalUrlUtils.getStandardPortalUrl(this.appConfig.portalUrl);
      var portal = portalUtils.getPortal(portalUrl);
      if(portal.user !== null)
      {
        userPortal = portal.user;
        userToken = userPortal.credential.token;
      }
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
      fs = new FilteringSelect({
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
      }, document.getElementById('sel-nota-gestion-sia'));

      fs.on('change', function (newValue) {
        when(store.get(newValue)).then(function (data) {
          console.log('sia: ', data);
          let id_sia = data.SIAs_Areas_SIA_ID_Gral;
          gLayer.clear();
          $("#detalle-sia-historial-fecha-gestion").text('');
          $("#detalle-sia-historial-estado-gestion").text('');
          $("#detalle-sia-historial-detalle-gestion").text('');
          $('#div-notas-registradas').html('');
          
          // Obtengo el historial de nostas de gestión de la SIA.
          getHistorialSia(id_sia);
          
          //Obtengo la ultima gestion de la sia
          getUltimaGestion(id_sia);
          
          let geom = data.geometry;
          var d = new Date(data.Dat_SIAs_Fecha_Solicitud);
          var options = {  dateStyle: 'medium' };
          var datetime = d.toLocaleString("es-CL", options);

          $("#nota-gestion-detalle-id-sia").val(data.Dat_SIAs_SIA_ID_LOCAL);
          $("#nota-gestion-detalle-SIA_IDE_Etiq").val(data.Dat_SIAs_SIA_IDE_Etiq);
          $("#nota-gestion-detalle-Dat_SIAs_Fecha_Solicitud").val(data.Dat_SIAs_Fecha_Solicitud);
          $("#nota-gestion-detalle-fecha-solicitud").val(datetime);
          $("#nota-gestion-detalle-texto").val(data.Dat_SIAs_Area_Solicitada);
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

          var infoTemplate = new InfoTemplate("SIA", html_infotemplate);
          var polygon = new Polygon(geom);
          var graphic = new Graphic(polygon, sfs, attr, infoTemplate);
          gLayer.add(graphic);
          map.setExtent(polygon.getExtent(), true)
        });
      });
    },

    getUltimaGestion: function (id_sia) {
      // var query = '/query?outFields=*&orderByFields=Fecha_Nota+desc&where=SIAIDGRAL2=\'' + id_sia + '\'&resultOffset=0&resultRecordCount=1&f=pjson';
      var url = config.urlBase + config.urlKeyNotasDeGestion;
      var query = new Query();
      query.outFields = ["*"];
      query.orderByFields = ['Fecha_Nota desc']
      query.where = 'SIAIDGRAL2=\'' + id_sia + '\'';
      getRequest(url, query).then(
        lang.hitch(this, function(response) { 
          if(response.featureSet.features.length > 0)
          {
            var data = response.featureSet.features[0].attributes
            var d = new Date(data.Fecha_Nota)
            var options = {  dateStyle: 'medium' };
            var datetime = d.toLocaleString("es-CL", options);

            $("#detalle-sia-historial-fecha-gestion").text(datetime);
            $("#detalle-sia-historial-estado-gestion").text(data.Estado_gestion);
            $("#detalle-sia-historial-detalle-gestion").text(data.Comentario);
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      )
    },

    getHistorialSia: function (id_sia) {
      // var query = '/query?outFields=*&orderByFields=Fecha_Nota+desc&where=SIAIDGRAL2=\'' + id_sia + '\'&f=pjson';
      var url = config.urlBase + config.urlKeyNotasDeGestion;
      var query = new Query();
      query.outFields = ["*"];
      query.orderByFields = ['Fecha_Nota desc']
      query.where = 'SIAIDGRAL2=\'' + id_sia + '\'';
       getRequest(url, query).then(
         lang.hitch(this, function(response) { 
           if(response.featureSet.features.length > 0)
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
             arrayUtils.forEach(response.featureSet.features, function(f) {
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
    },

    loadEstadosGestion: function () {
      // var query = '/query?outFields=*&&orderByFields=Estados_Gestion&where=1%3D1&f=pjson';
      var url = this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeyEstadoGestion;
      var query = new Query();
      query.outFields = ["*"];
      query.orderByFields = ['Estados_Gestion']
      query.where = '1=1';
      this.getRequest(url, query).then(
        lang.hitch(this, function(response) { 
          if(response.featureSet.features.length > 0)
          {
            let html = '<option value="-1">[Seleccione]</option>';
            html += response.featureSet.features.map(function (f) {
              return '<option value="' + f.attributes.Estados_Gestion + '">' + f.attributes.Estados_Gestion + '</option>';
            });
            $('#sel-nota-gestion-estado-sia').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );
    },

    loadProfesionalesInco: function () {
      // var query = '/query?outFields=*&where=1%3D1&f=pjson';
      var url = this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeyProfesionales;
      var query = new Query();
      query.outFields = ["*"];
      query.orderByFields = ['Apellidos']
      query.where = '1=1';
      this.getRequest(url, query).then(
        lang.hitch(this, function(response) { 
          if(response.featureSet.features.length > 0)
          {
            let html = '<option value="-1">[Seleccione]</option>';
            html += response.featureSet.features.map(function (f) {
              return '<option value="' + f.attributes.Nombre_apellido + '">' + f.attributes.Nombre_apellido + '</option>';
            });
            $('#sel-nota-gestion-autor').html(html)
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );
    },

    _onclickEnviar: function () {
      var deferred = new Deferred();
      var showMessage = this.showMessage;

      this.getData().then(
        lang.hitch(this, function(data) { 
          var strData = JSON.stringify([data.attr_nota])
          var sia_gral = data.attr_nota.attributes['SIAIDGRAL2'];
          var mensaje = data.mensaje;
          this.postRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeyNotasDeGestion + '/applyEdits', strData, 'adds').then(
            lang.hitch(this, function(objRes) { 
              console.log('objRes: ', objRes)
              if (objRes.addResults[0].success === true)
              {
                // Actualizo el estado de la SIA.
                var strData = JSON.stringify([data.attr_sia])
                this.postRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeySias + '/applyEdits', strData, 'updates').then(
                  lang.hitch(this, function(objRes) { 
                    console.log('objRes: ', objRes)
                    if (objRes.updateResults[0].success === true)
                    {
                      //Muestro el mensaje de éxito.
                      showMessage(mensaje);
                      //Refresco la capa de sias.
                      if (typeof featureLayerSias !== 'undefined') {
                        featureLayerSias.refresh();
                      }
                      //Reseteo el formunlario.
                      this.resetFormNota();
                      
                      getHistorialSia(sia_gral);
                      getUltimaGestion(sia_gral);
                      //Activo el select con la SIA gestinada para que cargue el historial.
                      // $("#sel-nota-gestion-sia").val("-1").change();
                      // $("#sel-nota-gestion-sia").val(sia_gral).change();

                      //Activo la pestaña historial
                      $("#historial-ng-tab").click();

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

    resetFormNota: function () {
      // $(':input').not(':button, :submit, :reset, :checkbox, :radio').val("");
      $("#txt-nota-gestion-fecha").val('');
      $("#txta-nota-gestion-texto").val('');
      $("#sel-nota-gestion-estado-sia").val("-1");
      $("#sel-nota-gestion-autor").val("-1");

      $("#tr-fecha-intervencion").hide();
      $("#tr-fecha-desmovilizacion").hide();
      $("#tr-fecha-real-desmovilizacion").hide();
      $("#tr-fecha-real-intervencion").hide();
    },

    resetForm: function () {
      $(':input').not(':button, :submit, :reset, :checkbox, :radio').val("");
      $("#sel-nota-gestion-sia").val("");
      $("#sel-nota-gestion-sia").change();
      $("#sel-nota-gestion-estado-sia").val("-1");
      $("#sel-nota-gestion-autor").val("-1");
      $("#tr-fecha-intervencion").hide();
      $("#tr-fecha-desmovilizacion").hide();
      $("#tr-fecha-real-desmovilizacion").hide();
      $("#tr-fecha-real-intervencion").hide();
    },

    getData: function () {
      var deferred = new Deferred();
      var mensaje = 'Nota de gestión ingresada exitosamente.';
      var data = {};

      var dataNota = {};
      var attributesNota = {};

      var dataSia = {};
      var attributesSia = {};

      // Valido que se elija una SIA
      // var sia_gral = $('#sel-nota-gestion-sia option:selected').val();
      var sia_gral = $('#sel-nota-gestion-sia').val();
      if (sia_gral == '-1' || sia_gral == '')
      {
        deferred.reject('Debe seleccionar una SIA')
      } else {
        attributesNota['SIAIDGRAL2'] = sia_gral
      }

      //Valido que ingrese la fecha de la solicitud
      var fechaSolicitud = $('#txt-nota-gestion-fecha').val();
      let datetime = new Date(fechaSolicitud).getTime();

      if (fechaSolicitud == '')
      {
        deferred.reject('Debe indicar fecha de la gestión');
      } else {
        attributesNota['Fecha_Nota'] = datetime;
      }
      
      //Valido que ingrese el estado de la nota de gestion.
      var estado = $('#sel-nota-gestion-estado-sia option:selected').val();
      if (estado == '-1' || estado == '')
      {
        deferred.reject('Debe seleccionar un estado actual de gestión');
      } else {
        //Estado de la nota de gestión.
        attributesNota['Estado_gestion'] = estado;

        //Estado de la sia
        attributesSia['Dat_SIAs_Estados_Gestion'] = estado;
        attributesSia['Estatus_general'] = statusGeneralSia[estado];

        var nuevoEstado = statusGeneralSia[estado];

        var Dat_SIAs_Fecha_Solicitud = $('#nota-gestion-detalle-Dat_SIAs_Fecha_Solicitud').val()
        let fechaSolicitud = new Date(parseInt(Dat_SIAs_Fecha_Solicitud));
        var datetime_now = new Date().getTime();

        diff = new Date(datetime_now - fechaSolicitud.getTime());
        diasGestion = parseInt((diff)/(24*3600*1000));
        
        // Este valor se debe calcular, considerar la fecha de inicio de la sia y el estado actual.
        // Depende del N° de días desde la Fecha de la 1era Nota de Gestión del grupo “En trámite”:
        // SIA de 7 días o menos (en SIG se despliegan con amarillo)
        // SIA de 8 a 14 días (en SIG, naranjo)
        // SIA de 15 días o mas (en SIG, rojo)

        console.log('Dat_SIAs_Fecha_Solicitud: ', Dat_SIAs_Fecha_Solicitud);
        console.log('nuevo estado: ', nuevoEstado);
        console.log('fechaSolicitud: ', fechaSolicitud);
        console.log('fechaSolicitud.getTime(): ', fechaSolicitud.getTime());
        console.log('diasGestion: ', diasGestion);

        if(nuevoEstado === 'En trámite')
        {
          if (diasGestion <= 7) {
            attributesSia['Dat_SIAs_Estado2'] = "SIA de 7 días o menos";
          }else if (diasGestion >= 8 && diasGestion <= 14) {
            attributesSia['Dat_SIAs_Estado2'] = "SIA de 8 a 14 días";
          } else if (diasGestion >= 15) {
            attributesSia['Dat_SIAs_Estado2'] = "SIA de 15 días o mas";
          }
        }else{
          attributesSia['Dat_SIAs_Estado2'] = statusEspecificoSia[estado];
        }


        if(estado === 'Aprobada')
        {
          let fecha_desmo = $('#Fecha_Desmovilizacion_Plan').val();
          let fecha_inter = $('#Fecha_InicioIntervencion_Plan').val();

          if (fecha_desmo == '' || fecha_inter == '')
          {
            deferred.reject('Debe indicar fecha tentativa para inicio de intervención y desmovilización.');
          }else{
            let datetime_desmo = new Date(fecha_desmo).getTime();
            let datetime_inter = new Date(fecha_inter).getTime();

            // if(datetime_now > datetime_desmo || datetime_now > datetime_inter)
            if(false)
            {
              deferred.reject('La fecha intervención y/o desmovilización no puede ser menor a hoy.');
            }else{
              attributesSia['Fecha_Desmovilizacion_Plan'] = datetime_desmo;
              attributesSia['Fecha_InicioIntervencion_Plan'] = datetime_inter;
              attributesSia['Doc_Link_Aprob'] = 'https://aminerals.sharepoint.com/sites/UsuariosSIGINCO/SIAs%20Verificadores/'+ sia_gral +'/Aprobacion.pdf';
              mensaje = `Nota de gestión ingresada exitosamente.
              Recuerda ingresar el documento de aprobación en repositorio de Sharepoint:
              Nombre documento a cargar: "Aprobacion.pdf"
              Nombre de carpeta a crear: ${sia_gral} 
              Link repositorio: https://aminerals.sharepoint.com/sites/UsuariosSIGINCO/SIAs%20Verificadores
              
              Tu ayuda es muy importante para nuestro control documental. ¡Muchas gracias!`;
            }
          }
        }

        if(estado === 'Desmovilizada')
        {
          let fecha_real_desmo = $('#Fecha_Desmovilizacion_Real').val();
          if(fecha_real_desmo == '')
          {
            deferred.reject('Debe indicar fecha real de desmovilización.');
          }else{
            let datetime_real_desmo = new Date(fecha_real_desmo).getTime();

            // if(datetime_now > datetime_real_desmo)
            // {
              // deferred.reject('La fecha real de desmovilización no puede ser menor a hoy.');
            // }else{
              attributesSia['Fecha_Desmovilizacion_Real'] = datetime_real_desmo;
              attributesSia['Doc_Link_Desmov'] = 'https://aminerals.sharepoint.com/sites/UsuariosSIGINCO/SIAs%20Verificadores/'+ sia_gral +'/Desmovilizacion.pdf'
              mensaje = `Nota de gestión ingresada exitosamente.
              Recuerde ingresar el documento de aprobación en repositorio de Sharepoint (en el siguiente link : https://aminerals.sharepoint.com/sites/UsuariosSIGINCO/SIAs%20Verificadores/${sia_gral}:
              Nombre documento a cargar: "Desmovilizacion.pdf"
              
              Tu ayuda es muy importante para nuestro control documental. ¡Muchas gracias!`;
            // }
          }
        }

        if(estado === 'Construcción iniciada')
        {
          let fecha_real_inter = $('#Fecha_InicioIntervencion_Real').val();

          if(fecha_real_inter == '')
          {
            deferred.reject('Debe indicar fecha real de inicio intervención.');
          }else{
            let datetime_real_inter = new Date(fecha_real_inter).getTime();

            // if(datetime_now > datetime_real_inter)
            // {
              // deferred.reject('La fecha real de inicio intervención no puede ser menor a hoy.');
            // }else{
              attributesSia['Fecha_InicioIntervencion_Real'] = datetime_real_inter;
            // }
          }
        }
      }

      var objectid = $('#nota-gestion-detalle-objectid').val();
      attributesSia['OBJECTID'] = parseInt(objectid);

      //Valido que ingrese un comentario
      var comentario = $('#txta-nota-gestion-texto').val()
      if (comentario == '')
      {
        deferred.reject('Debe ingresar una nota de gestión')
      } else {
        attributesNota['Comentario'] = comentario
        attributesSia['Dat_SIAs_Comentario'] = comentario;
      }

      //Valido que ingrese un profesional inco.
      var profesional = $('#sel-nota-gestion-autor option:selected').val()
      if (profesional == '-1' || profesional == '')
      {
        deferred.reject('Debe seleccionar un autor')
      } else {
        attributesNota['Nombre_apellido'] = profesional;
      }

      var id_sia_gral = $('#nota-gestion-detalle-id-sia').val()
      attributesNota['SIA_ID_LOCAL'] = id_sia_gral;
      var SIA_IDE_Etiq = $('#nota-gestion-detalle-SIA_IDE_Etiq').val()
      attributesNota['SIA_IDE_Etiq'] = SIA_IDE_Etiq;

      dataNota['attributes'] = attributesNota;
      data['attr_nota'] = dataNota;
      dataSia['attributes'] = attributesSia;
      data['attr_sia'] = dataSia;
      data['mensaje'] = mensaje;
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

    getRequest: function (url, query) {
      try{
        var deferred = new Deferred();
        var queryTask = new QueryTask(url);
        
        queryTask.execute(query);
        queryTask.on("complete", function(response){
          console.log('complete response: ', response)
          deferred.resolve(response);
        });
        queryTask.on("error", function(error){
          console.log('error: ', error)
          deferred.reject();
        });
      } catch(err) {
          console.log('request failed', err)
        deferred.reject();
      }
      return deferred.promise;
    },

    getRequest_old: function (url) {
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
        if(userToken !== null)
        {
          formData.append('token', userToken);
        }

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
      console.log('postCreate widget notas de gestion');
      console.log('post global_id_sia_general: ', global_id_sia_general);
    },

    onOpen: function () {
      console.log('onOpen widget notas de gestion');
      console.log('open global_id_sia_general: ', global_id_sia_general);
      if(global_id_sia_general)
      {
        $("#sel-nota-gestion-sia").val(global_id_sia_general);

        var url = config.urlBase + config.urlKeySias;
        var query = new Query();
        query.outFields = ["*"];
        query.where = 'SIAs_Areas_SIA_ID_Gral=\'' + global_id_sia_general + '\'';
        query.returnGeometry = false;
        getRequest(url, query).then(
          lang.hitch(this, function(response) { 
            if(response.featureSet.features.length > 0)
            {
              console.log('response siaaaa: ', response);
              var data = response.featureSet.features[0].attributes
              var d = new Date(data.Fecha_Nota)
              var options = {  dateStyle: 'medium' };
              var datetime = d.toLocaleString("es-CL", options);

              $("#detalle-sia-historial-fecha-gestion").text('');
              $("#detalle-sia-historial-estado-gestion").text('');
              $("#detalle-sia-historial-detalle-gestion").text('');
              $('#div-notas-registradas').html('');

              // Obtengo el historial de nostas de gestión de la SIA.
              getHistorialSia(global_id_sia_general);
                        
              //Obtengo la ultima gestion de la sia
              getUltimaGestion(global_id_sia_general);

              $("#nota-gestion-detalle-id-sia").val(data.Dat_SIAs_SIA_ID_LOCAL);
              $("#nota-gestion-detalle-SIA_IDE_Etiq").val(data.Dat_SIAs_SIA_IDE_Etiq);
              $("#nota-gestion-detalle-Dat_SIAs_Fecha_Solicitud").val(data.Dat_SIAs_Fecha_Solicitud);
              $("#nota-gestion-detalle-fecha-solicitud").val(datetime);
              $("#nota-gestion-detalle-texto").val(data.Dat_SIAs_Area_Solicitada);
              $("#nota-gestion-detalle-registrada").val(data.Resgistrado_por);
              $("#nota-gestion-detalle-solicitada").val(data.ID_Solicitante);
              $("#nota-gestion-m2").val(data.SIAs_Areas_Area_m2);
              $("#nota-gestion-id-sia-gral").val(data.SIAs_Areas_SIA_ID_Gral);
              $("#nota-gestion-detalle-objectid").val(data.OBJECTID);
            }
          }),
          function(objErr) {
            console.log('request failed', objErr)
          }
        );
      }
    },

    onClose: function () {
      console.log('onClose');
      var gLayer = this.map.getLayer("gLayerGraphicNotas");
			gLayer.clear();
      this.resetForm();
      global_id_sia_general = null;
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
