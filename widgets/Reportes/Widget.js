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
var config, map;
var data = [];
var dataReporteDiario = [];
var dataReporteSia = [];
define([
  'dojo/_base/declare', 
  'jimu/BaseWidget',
  "dojo/dom",
  "jimu/dijit/Message",
  "dojo/_base/array",
  "dojo/Deferred",
  "dojo/_base/lang",
  'jimu/portalUtils',
  'jimu/portalUrlUtils',
  "./store/ArcGISServerStore.js",
  "dojo/store/Cache",
  "dojo/store/Memory",
  "dojo/when",
  "dijit/form/FilteringSelect", 
  "esri/tasks/QueryTask", 
  "esri/tasks/query",
],
function(
  declare, 
  BaseWidget,
  dom,
  Message,
  arrayUtils, 
  Deferred,
  lang,
  portalUtils, 
  portalUrlUtils,
  ArcGISServerStore, 
  Cache,
  Memory, 
  when, 
  FilteringSelect, 
  QueryTask, 
  Query, 
  ){
  return declare(BaseWidget, {
    startup: function(){
      map = this.map;
      config = this.appConfig.Sias;

      //Obtengo el token del usuario logueado de portal
      this.getUserTokenPortal();

      //Creo el reporte general de sias
      this.getInformeGeneralSia();

      // Creo el reporte diario
      this.getReporteDiario();

      // Creo el reporte de notas
      this.getReporteNotas()

    },

    getUserTokenPortal: function () {
      var portalUrl = portalUrlUtils.getStandardPortalUrl(this.appConfig.portalUrl);
      var portal = portalUtils.getPortal(portalUrl);
      userPortal = portal.user;
      userToken = userPortal.credential.token;
    },

    getReporteNotas: function () {
      // Create ArcGISServerStore
      var agsStore = new ArcGISServerStore({
        url: config.urlBase + config.urlKeySias,
        flatten: true,
        returnGeometry: false,
        outFields: ['*']
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
        style: "display: block;width: 60%;height: calc(1.5em + .75rem + 2px);padding: .375rem .75rem;font-size: 1rem;font-weight: 400;line-height: 1.5;color: #495057;background-color: #fff;background-clip: padding-box;border: 1px solid #ced4da;border-radius: .25rem;transition: border-color .15s ease-in-out,box-shadow .15s ease-in-out;margin-top: 5px;",
        required: false,
        hasDownArrow: true,
        pageSize: 15,
        autoComplete: true,
      }, document.getElementById('searchSia'));

      fs.on('change', function (newValue) {
        when(store.get(newValue)).then(function (sia) {
          dataReporteSia = [];
          $("#btn-descargar-reporte-notas-sias").hide();
          var SIAs_Areas_SIA_ID_Gral  = sia.SIAs_Areas_SIA_ID_Gral ;
          var qt = new QueryTask(config.urlBase + config.urlKeyNotasDeGestion);
          var query = new Query();
          query.where = "SIAIDGRAL2 = \'"+SIAs_Areas_SIA_ID_Gral+"\'";
          query.returnGeometry = false;
          query.outFields = ['*'];
          query.orderByFields = ['Fecha_Nota desc'];

          qt.execute(query, function (response) {
            if (response.features.length > 0)
            {
              $("#btn-descargar-reporte-notas-sias").show();
              var html = '<table class="table table-hover table-sm"><thead class="thead-light">';
              html += '<tr>';
              html += '<th scope="col">SIA</th>';
              html += '<th scope="col">Área solicitada</th>';
              html += '<th scope="col">Fecha de nota</th>';
              html += '<th scope="col">Estado gestión</th>';
              html += '<th scope="col">Comentario</th>';
              html += '<th scope="col">Nota ingresada por</th>';
              html += '</tr></thead><tbody>';
              arrayUtils.forEach(response.features, function(f) {
                dataReporteSia.push(f.attributes);
                let fechaSolicitud = new Date(f.attributes.Fecha_Nota);
                let options = {  dateStyle: 'medium' };
                let datetimefechaSolicitud = fechaSolicitud.toLocaleString("es-CL", options);
                html += '<tr>';
                html += '<td scope="row">' + f.attributes.SIAIDGRAL2 + '</td>';
                html += '<td scope="row">' + f.attributes.Area_Solicitada + '</td>';
                html += '<td scope="row">' + datetimefechaSolicitud + '</td>';
                html += '<td scope="row">' + f.attributes.Estado_gestion + '</td>';
                html += '<td scope="row">' + f.attributes.Comentario + '</td>';
                html += '<td scope="row">' + f.attributes.Nombre_apellido + '</td>';
                html += '</tr>';
              }, this);
              html += '</tbody></table>';
              $("#div-reporte-notas-sias").html(html);
            }
          });
        });
      });
    },

    getReporteDiario: function () {
      var query = '/query?outFields=*&returnGeometry=false&where=Dat_SIAs_Estados_Gestion%3C%3E%27Aprobada%27+and+Dat_SIAs_Estados_Gestion%3C%3E%27Desmovilizada%27+and+Dat_SIAs_Estados_Gestion%3C%3E%27Desistida%27&orderByFields=Dat_SIAs_SIA_EPC%2C+Dat_SIAs_Estados_Gestion&f=pjson'
      this.getRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeySias + query).then(
        lang.hitch(this, function(response) { 
          if(response.features.length > 0)
          {
            $("#btn-descargar-reporte-diario").show();
            var html = '<table class="table table-bordered table-sm"><thead>';
            html += '<tr>';
            html += '<th scope="col">EPC</th>';
            html += '<th scope="col">SIA</th>';
            html += '<th scope="col">Área solicitada</th>';
            html += '<th scope="col">Fecha solicitud</th>';
            html += '<th scope="col">Fecha respuesta</th>';
            html += '<th scope="col">Dias gestión</th>';
            html += '<th scope="col">Estado actual</th>';
            html += '<th scope="col">Estado general</th>';
            html += '<th scope="col">Comentario</th>';
            html += '</tr></thead><tbody>';

            arrayUtils.forEach(response.features, function(f) {
              dataReporteDiario.push(f.attributes);
              let fechaActual = new Date();
              let fechaSolicitud = new Date(f.attributes.Dat_SIAs_Fecha_Solicitud);
              let fechaAprobada = new Date(f.attributes.Dat_SIAs_Fecha_Aprobada);
              let diff, datetimefechaAprobada;
              let options = {  dateStyle: 'medium' };
              let diasGestion = 0;

              if (typeof f.attributes.Dat_SIAs_Fecha_Aprobada === 'object' && f.attributes.Dat_SIAs_Fecha_Aprobada === null)
              {
                diff = new Date(fechaActual.getTime() - fechaSolicitud.getTime());
                datetimefechaAprobada = ''
              }else{
                diff = new Date(fechaAprobada.getTime() - fechaSolicitud.getTime());
                datetimefechaAprobada = fechaAprobada.toLocaleString("es-CL", options);
              }
              
              let datetimefechaSolicitud = fechaSolicitud.toLocaleString("es-CL", options);
              diasGestion = parseInt((diff)/(24*3600*1000));
              
              let color = '';
              color2 = 'black';
              if (f.attributes.Dat_SIAs_Estados_Gestion == 'Aprobada') {
                color = '#a3cbaa';
              } else if (f.attributes.Dat_SIAs_Estados_Gestion == 'Desmovilizada') {
                color = '#469cd6';
                color2 = 'white';
              } else if (f.attributes.Dat_SIAs_Estados_Gestion == 'Desistida') {
                color = '#c4c6c6';
              } else {
                if (diasGestion <= 7) {
                  color = '#FFF5A0';
                }else if (diasGestion >= 8 && diasGestion <= 14) {
                  color = '#F8BA87';
                } else if (diasGestion >= 15) {
                  color = '#c40707';
                  color2 = 'white';
                }
              }

              html += '<tr style="background-color:'+color+';color:'+color2+'">';
              html += '<td scope="row"><b>' + f.attributes.Dat_SIAs_SIA_EPC + '</b></td>';
              html += '<td scope="row">' + f.attributes.Dat_SIAs_SIAIDGRAL2 + '</td>';
              html += '<td scope="row">' + f.attributes.Dat_SIAs_Area_Solicitada + '</td>';
              html += '<td scope="row">' + datetimefechaSolicitud + '</td>';
              html += '<td scope="row">' + datetimefechaAprobada + '</td>';
              html += '<td scope="row">' + diasGestion + '</td>';
              html += '<td scope="row">' + f.attributes.Dat_SIAs_Estados_Gestion + '</td>';
              html += '<td scope="row">' + f.attributes.Dat_SIAs_Estado2 + '</td>';
              html += '<td scope="row">' + f.attributes.Dat_SIAs_Comentario + '</td>';
              html += '</tr>';
            }, this);
            html += '</tbody></table>';
            $("#div-reporte-diario").html(html);
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );
    },

    getInformeGeneralSia: function () {
      var query = '/query?outFields=*&returnGeometry=false&where=1%3D1&orderByFields=Dat_SIAs_SIA_EPC%2C+Dat_SIAs_Estados_Gestion&f=pjson'
      this.getRequest(this.appConfig.Sias.urlBase + this.appConfig.Sias.urlKeySias + query).then(
        lang.hitch(this, function(response) { 
          if(response.features.length > 0)
          {
            $("#btn-descargar-informe-gral").show();
            var html = '<table class="table table-bordered table-sm"><thead>';
            html += '<tr>';
            html += '<th scope="col">EPC</th>';
            html += '<th scope="col">SIA</th>';
            html += '<th scope="col">Área solicitada</th>';
            html += '<th scope="col">Fecha solicitud</th>';
            html += '<th scope="col">Fecha respuesta</th>';
            html += '<th scope="col">Dias gestión</th>';
            html += '<th scope="col">Estado actual</th>';
            html += '<th scope="col">Estado general</th>';
            html += '<th scope="col">Comentario</th>';
            html += '</tr></thead><tbody>';

            arrayUtils.forEach(response.features, function(f) {
              data.push(f.attributes);
              let fechaActual = new Date();
              let fechaSolicitud = new Date(f.attributes.Dat_SIAs_Fecha_Solicitud);
              let fechaAprobada = new Date(f.attributes.Dat_SIAs_Fecha_Aprobada);
              let diff, datetimefechaAprobada;
              let options = {  dateStyle: 'medium' };
              let diasGestion = 0;

              if (typeof f.attributes.Dat_SIAs_Fecha_Aprobada === 'object' && f.attributes.Dat_SIAs_Fecha_Aprobada === null)
              {
                diff = new Date(fechaActual.getTime() - fechaSolicitud.getTime());
                datetimefechaAprobada = ''
              }else{
                diff = new Date(fechaAprobada.getTime() - fechaSolicitud.getTime());
                datetimefechaAprobada = fechaAprobada.toLocaleString("es-CL", options);
              }
              
              let datetimefechaSolicitud = fechaSolicitud.toLocaleString("es-CL", options);
              diasGestion = parseInt((diff)/(24*3600*1000));
              
              let color = '';
              color2 = 'black';
              if (f.attributes.Dat_SIAs_Estados_Gestion == 'Aprobada') {
                color = '#a3cbaa';
              } else if (f.attributes.Dat_SIAs_Estados_Gestion == 'Desmovilizada') {
                color = '#469cd6';
                color2 = 'white';
              } else if (f.attributes.Dat_SIAs_Estados_Gestion == 'Desistida') {
                color = '#c4c6c6';
              } else {
                if (diasGestion <= 7) {
                  color = '#FFF5A0';
                }else if (diasGestion >= 8 && diasGestion <= 14) {
                  color = '#F8BA87';
                } else if (diasGestion >= 15) {
                  color = '#c40707';
                  color2 = 'white';
                }
              }

              html += '<tr style="background-color:'+color+';color:'+color2+'">';
              html += '<td scope="row"><b>' + f.attributes.Dat_SIAs_SIA_EPC + '</b></td>';
              html += '<td scope="row">' + f.attributes.Dat_SIAs_SIAIDGRAL2 + '</td>';
              html += '<td scope="row">' + f.attributes.Dat_SIAs_Area_Solicitada + '</td>';
              html += '<td scope="row">' + datetimefechaSolicitud + '</td>';
              html += '<td scope="row">' + datetimefechaAprobada + '</td>';
              html += '<td scope="row">' + diasGestion + '</td>';
              html += '<td scope="row">' + f.attributes.Dat_SIAs_Estados_Gestion + '</td>';
              html += '<td scope="row">' + f.attributes.Dat_SIAs_Estado2 + '</td>';
              html += '<td scope="row">' + f.attributes.Dat_SIAs_Comentario + '</td>';
              html += '</tr>';
            }, this);
            html += '</tbody></table>';
            $("#div-informe-general").html(html);
          }
        }),
        function(objErr) {
          console.log('request failed', objErr)
        }
      );
    },

    _onclickDescargarInformeGeneral: function () {
      this.exportXLSX('informe_general_sias.xlsx', data, 'Hoja1');
    },

    _onclickDescargarReporteDiario: function () {
      this.exportXLSX('reporte_diario_sias.xlsx', dataReporteDiario, 'Hoja1');
    },

    _onclickDescargarReporteSias: function () {
      console.log('dataReporteSia: ', dataReporteSia);
      this.exportXLSX('reporte_sia.xlsx', dataReporteSia, 'Hoja1');
    },

    exportXLSX: function (fileName, jsonData, sheetName) {
      var ws = XLSX.utils.json_to_sheet(jsonData);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb,fileName);
    },

    getRequest: function (url) {
      try{
        var deferred = new Deferred();
        fetch(url + '&token=' + userToken)
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
  });
});
