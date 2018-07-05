var request = require("request");
var cheerio = require("cheerio");
var m_anticaptcha = require('./anticaptcha/anticaptcha');

var express = require('express');
var app = express();

var fs = require("fs");

var j = request.jar();

var url = "http://online9.detran.pe.gov.br/ServicosWeb/Veiculo/frmConsultaPlaca.aspx?placa=PGP8814"

var start_fields = {};

request.get(
    url,
    {
        headers: {
            "Referer": "http://www.detran.pe.gov.br/index.php?option=com_search_placa&placa=PGP8814"
        },
        jar: j
    },
    function (e, response) {
        fs.writeFile("01.html", response.body, function (e) { });

        var fields = extractFields(response.body);
        var sitekey = recaptchaGetSiteKey(response.body);

        resolveRecaptcha(url, sitekey, function (err, taskSolution) {
            if (err) {
                console.error(err);
                return;
            }

            console.log("RECAPTCHA resolvido.");

            fields["g-recaptcha-response"] = taskSolution;

            request.post("http://online9.detran.pe.gov.br/ServicosWeb/Veiculo/frmConsultaPlaca.aspx?placa=PGP8814",
                {
                    form: fields,
                    headers: {
                        "Referer": "http://online4.detran.pe.gov.br/ServicosWeb/Veiculo/frmConsultaPlaca.aspx?placa=PGP8814"
                    },
                    jar: j
                },
                function (e, response) {
                    fs.writeFile("02.html", response.body, function (e) { });
                    start_fields = extractFields(response.body);
                    delete start_fields.btnImprimir;

                    app.get('/detran', function (req, res) {
                        console.log(req.url);
                        testeAloprado(start_fields, req.query.placa, function (e, data) {
                            console.log(data);
                            res.send(data);
                        });
                    });

                    app.listen(3000);

                    console.log('listening on port 3000');
                }
            );
        });

    }
)

function testeAloprado(fields, placa, callback) {

    request.post("http://online9.detran.pe.gov.br/ServicosWeb/Veiculo/frmConsultaPlaca.aspx?placa=" + placa,
        {
            form: fields,
            headers: {
                "Referer": "http://online4.detran.pe.gov.br/ServicosWeb/Veiculo/frmConsultaPlaca.aspx?placa=" + placa
            },
            jar: j
        },
        function (e, response) {
            if (e != null) {
                callback(e);
            }

            fs.writeFile(placa + "_03.html", response.body, function (e) { });

            var fields = extractFields(response.body);
            delete fields.btnLocalizacao;

            var data = extractVeicleData(response.body);


            request.post("http://online9.detran.pe.gov.br/ServicosWeb/Veiculo/frmConsultaPlaca.aspx?placa=" + placa,
                {
                    form: fields,
                    headers: {
                        "Referer": "http://online4.detran.pe.gov.br/ServicosWeb/Veiculo/frmConsultaPlaca.aspx?placa=" + placa
                    },
                    jar: j
                },
                function (e, response) {
                    if (e != null) {
                        callback(e);
                    }

                    fs.writeFile(placa + "_04.html", response.body, function (e) { });

                    data.detalhamento = extractDebitDetails(response.body);

                    callback(null, data);
                }
            );
        }
    );
}

function extractFields(html) {
    var $ = cheerio.load(html);
    var fields = {};

    $("form input").each(function (i, element) {
        fields[$(this).attr('name')] = $(this).attr('value');
    });

    return fields;
}

function recaptchaGetSiteKey(html) {
    var $ = cheerio.load(html);

    return $("div.g-recaptcha").attr('data-sitekey');
}

function resolveRecaptcha(url, sitekey, callback) {
    // callback(null, "03ACgFB9s0A2zW1x_C5iGt_nKt57WITHn7gAKi2_3ehnwfDM5xKunlA5Z1I78iyDWhrmzMQEcMmFe5Te-jAMF_PuMOWZaVZz4CuSmBS6ttE0c_RsLZzSzZ1ZhSIOJbY_I2KZlVOOpCdAARbx3bvYV9-IpTu5_xbvv8VagIhZJWiek8eehLn6gLj0ERT7ev1pu-9hMGy_k2Q6J5fKrQQ-9Pzup7s1ZQZvAH8pd8oZD__1jOcI3w79tKM0i_icttrC6a2G_8x6aDsWLVOlYfIkEUsnEFcio3hVpD11WtIsiIpS7lCWwHmga_ogMFsrvLTs1986X2QglItp_Hk2n8j5XzNQVu4iUcHu3irRS8E9ratnDhCwhnzFnDXPsxGICDEkGv6kage_uW8eoFh0zjVfkU24ZZhkXRPwOrCCE6acnDKIL14iWydqiiXq4");
    // return;

    var anticaptcha = m_anticaptcha('APP_MY_ID');

    anticaptcha.setWebsiteURL(url);
    anticaptcha.setWebsiteKey(sitekey);

    anticaptcha.createTaskProxyless(function (e, taskId) {
        if (e) {
            callback(e);
            return;
        }

        anticaptcha.getTaskSolution(taskId, callback);
    });

    //return "03ACgFB9vu7gf0RkKgYaGBolighnTpgAFat7iy4DJ6t7l0LiSVVcmUfb5oRQjGSyv5Jb7Yv47mI_VipcqucoXS7mfdpCIpxCd0HYb1_GE3bnE5kZ9i463DzyrH6EeNmmrSvjogNecltcFXXH90hHFA3H9weVRQdleHNF9rc8eOCBp10bAQsC7NZZ5kzPEOHQTOnvjnJ528lbjWJTIv_Iup0krnQ7o9htKRoO_Akj1TTLjdHpgzJC5_ecHiWOER2XjSZm-gK4L4t6Od0CEzzYZ8DdeYYvryUJ4zvMyfkHcO7IvPmiCjc5yFoV9BRo0O1cYHPHfT635egbP71haOtP5N8uqk3mmhUjHs6n8L1xgdWKEXaAv9l1wtvNPb3rcq07ZskXl7zuZZh88nMTC1lg2UqzOWb2DjajUZhw23S6zH_PAQ60JEanj3rPceiGloPVa1r0rbgwwGIg-ag-ybm0aHkYj6QIML8ZmkLQ";
}

function extractVeicleData(html) {
    var $ = cheerio.load(html);

    var data = {};

    data.chassi = $("#lblChassi").text();
    data.combustivel = $("#lblCombustivel").text();
    data.modelo = $("#lblMarcaModelo").text();
    data.anoFabricacao = $("#lblAnoFab").text();
    data.anoModelo = $("#lblAnoModelo").text();
    data.cor = $("#lblCor").text();

    return data;
}

function extractDebitDetails(html) {
    var $ = cheerio.load(html);

    var monetario_regex = /\d{1,3}(?:\.\d{3})*,\d{2}/;
    var multa_cota_regex = /Cota: (.*)/;
    var multa_vencimento_regex = /Vencimento: (.*)/;
    var multa_limite_defesa_regex = /Limite Identificação\/Defesa: (.*)/;
    var multa_valor_regex = /Valor\(R\$\): (.*)/;
    var multa_detalhamento_regex = /Infracao:\s(.*)Data:.*Local:.*/;

    var data = {};
    data.restricoes = [];

    $("#pnlRestricao ul li span").map(function (i, e) {
        if ($(this).text() != "") {
            data.restricoes.push($(this).text());
        }
    });

    data.licenciamento = [];
    $("#gdvLicenciamento tr").map(function (i, e) {
        if ($(this).find("td").length == 5) {
            data.licenciamento.push({
                debito: $(this).children("td").eq(0).text(),
                exercicio: $(this).children("td").eq(1).text(),
                cota: $(this).children("td").eq(2).text().trim(),
                vencimento: $(this).children("td").eq(3).text(),
                valor: $(this).children("td").eq(4).text()
            });
        }
    });

    //console.log(multa_detalhamento_regex.exec($(".grid tr.detalhamento td").text()));

    data.multas = [];
    $(".grid tr.valores").map(function (i, e) {
        //console.log(multa_vencimento_regex.exec($(this).children("td").eq(1).text()));
        var multa = {
            cota: multa_cota_regex.exec($(this).children("td").eq(0).text())[1],
            //vencimento: multa_vencimento_regex.exec()[1],
            valor: multa_valor_regex.exec($(this).children("td").eq(2).text())[1],
            infracao: multa_detalhamento_regex.exec($(".grid tr.detalhamento").eq(i).text())[1]
        };

        if (multa_vencimento_regex.exec($(this).children("td").eq(1).text()) != null) {
            multa.vencimento = multa_vencimento_regex.exec($(this).children("td").eq(1).text())[1];
        }

        if (multa_limite_defesa_regex.exec($(this).children("td").eq(1).text()) != null) {
            multa.limite_defesa = multa_limite_defesa_regex.exec($(this).children("td").eq(1).text())[1];
        }

        data.multas.push(multa);
    });

    if ($("#lblCotaUnica.vlTotal").length == 1) {
        data.totalizador = {};
        data.totalizador.cotaUnica = monetario_regex.exec($("#lblCotaUnica.vlTotal").text())[0];
        data.totalizador.cotaParcelada = monetario_regex.exec($("#lblCotaParcelada.vlTotal").text())[0];
    }

    return data;
}