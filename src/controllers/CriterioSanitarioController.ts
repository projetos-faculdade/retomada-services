import { Response, Request} from  'express';

import db from '../database/connection';
import LogsController from './LogsController';

export default class criterioSanitarioController {

    logsController = new LogsController();
    tiposLog = {
        EDITLOG: 'EDITAR-CRITERIO-SANITARIO',
        CREATELOG: 'CRIAR-CRITERIO-SANITARIO',
        EXCLUDELOG: 'EXCLUIR-CRITERIO-SANITARIO',
        LISTLOG: 'LISTAR-CRITERIO-SANITARIO'
    }

    async create(request: Request, response: Response) {

        var {
            lotacao_maxima, // % de lotação. Ex.:30
            uso_mascara,
            distanciamento_minimo,
            id_instituicao,
            id_usuario
        } = request.body;

        if (!lotacao_maxima || !uso_mascara || !id_instituicao || !id_usuario) 
            return response.status(500).json({
                error: 'Parâmetros requeridos não foram informados'
            });

        try {
            await db('criterio_sanitario').insert({
                criacao: db.fn.now(),
                ultima_atualizacao: db.fn.now(),
                lotacao_maxima,
                uso_mascara,
                distanciamento_minimo,
                id_instituicao,
            }).then(() => { 
                response.status(200).json ({
                    message: 'Criterio cadastrado com sucesso'
                });
          });

          //gerando log de criação de instituição 
          var conteudoEdicao = {
            lotacao_maxima, 
            uso_mascara,
            distanciamento_minimo,
            id_instituicao
          };
          this.logsController.create(id_usuario as string, conteudoEdicao, this.tiposLog.CREATELOG);

        } catch(err) {
            return response.status(500).json({
                error: 'Erro ao inserir novo critério sanitário',
                sqlMessage: err.sqlMessage,
                sqlState: err.sqlState
            });
        } finally {
            db.destroy();
        }
    }

    async index(request: Request, response: Response) {
        const stringFilters = request.query.filters as string;
        const filters = JSON.parse(stringFilters);

        if (!filters.id_usuario) {
            return response.status(500).json({
                error: 'O nome do usuário que realizou a ação não foi informado'
            });
        }

        try {
            var query = await db('criterio_sanitario').select('*').where(function() {
                if(filters.id_instituicao)
                    this.where('id_instituicao', filters.id_instituicao);
                if(filters.uso_mascara)
                    this.where('uso_mascara', filters.uso_mascara);
                if(filters.distanciamento_minimo)
                    this.where('distanciamento_minimo', filters.distanciamento_minimo);
            }); 
            
            //gerando log de criação de instituição 
            var conteudoListagem = {
                id_instituicao: filters.id_instituicao,
                uso_mascara: filters.uso_mascara,
                distanciamento_minimo: filters.distanciamento_minimo
            };
            this.logsController.create(filters.id_usuario as string, conteudoListagem, this.tiposLog.LISTLOG);
            
            return response.status(200).json(query);
        } catch (err) {
            return response.status(500).json({
                error: 'Erro ao consultar criterios sanitarios',
                sqlMessage: err.sqlMessage,
                sqlState: err.sqlState
            });
        } finally {
            db.destroy();
        }
    }

    async delete(request: Request, response: Response) {
        const stringFilters = request.query.filters as string;
        const filters = JSON.parse(stringFilters);

        if(!filters || !filters.id_usuario || (!filters.id_criterio_sanitario && !filters.id_instituicao)) {
            response.status(500).json({
                error: 'Nenhum filtro de deleção foi informado'
            });
        }

        try {
            var query = await db('criterio_sanitario').where(function() {
                if(filters && filters.id_criterio_sanitario)
                    this.whereIn('id_criterio_sanitario', filters.id_criterio_sanitario);
                if(filters && filters.id_instituicao)
                    this.whereIn('id_instituicao', filters.id_instituicao);
            }).del().then(function(){
                response.status(200).json ({
                    message: 'Critérios sanitários deletados com sucesso'
                });
            }); 
            var conteudoExclusao = {
                id_criterio_sanitario: filters.id_criterio_sanitario,
                id_instituicao: filters.id_instituicao,
            };
            this.logsController.create(filters.id_usuario as string, conteudoExclusao, this.tiposLog.EXCLUDELOG);
        } catch (err) {
            return response.status(500).json({
                error: 'Erro ao deletar critérios sanitários',
                sqlMessage: err.sqlMessage,
                sqlState: err.sqlState
            });
        } finally {
            db.destroy();
        }
    }

    async edit(request: Request, response: Response) {
        const stringFilters = request.query.filters as string;
        const filters = JSON.parse(stringFilters);
        var {
            lotacao_maxima,
            uso_mascara,
            distanciamento_minimo,
            id_instituicao,
            id_usuario
        } = request.body;

        if(!filters || !filters.id_usuario || (!filters.id_criterio_sanitario && !filters.id_instituicao)) {
            response.status(500).json({
                error: 'Nenhum filtro de deleção foi informado'
            });
        }

        var columns:any = {};
        columns.ultima_atualizacao = db.fn.now();
        if (lotacao_maxima)
            columns.lotacao_maxima = lotacao_maxima; 
        if (uso_mascara)
            columns.uso_mascara = uso_mascara; 
        if (distanciamento_minimo)
            columns.distanciamento_minimo = distanciamento_minimo; 
        if (id_instituicao)
            columns.id_instituicao = id_instituicao;

        try {
            var query = await db('criterio_sanitario')
            .where(function() {
                if(filters && filters.id_criterio_sanitario)
                    this.whereIn('id_criterio_sanitario', filters.id_criterio_sanitario);
                if(filters && filters.id_instituicao)
                    this.whereIn('id_instituicao', filters.id_instituicao);
            })
            .update(columns)
            .then(function(){
                response.status(200).json ({
                    message: 'Critérios sanitários editados com sucesso'
                });
            }); 
            this.logsController.create(filters.id_usuario as string, columns, this.tiposLog.EDITLOG);
        } catch (err) {
            return response.status(500).json({
                error: 'Erro ao editar critérios sanitários',
                sqlMessage: err.sqlMessage,
                sqlState: err.sqlState
            });
        } finally {
            db.destroy();
        }
    }
}
