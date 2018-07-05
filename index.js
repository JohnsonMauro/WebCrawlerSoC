var request = require("request");
var cheerio = require("cheerio");
var m_anticaptcha = require('./anticaptcha/anticaptcha');

var fs = require("fs");

var j = request.jar();

var url = "http://online9.detran.pe.gov.br/ServicosWeb/Veiculo/frmConsultaPlaca.aspx?placa=PGP8814"

request.get(
    url,
    {
        headers: {
            "Referer": "http://www.detran.pe.gov.br/index.php?option=com_search_placa&placa=PGP8814"
        },
        jar: j
    },
    function (e, response) {
        console.log(response.request.uri.href);
        console.log(recaptchaGetSiteKey(response.body));
        fs.writeFile("output/01.html", response.body, function (e) { });

        var fields = extractFields(response.body);
        var sitekey = recaptchaGetSiteKey(response.body);

        resolveRecaptcha(url, sitekey, function (err, taskSolution) {
            if (err) {
                console.error(err);
                return;
            }

            console.log(taskSolution);

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
                    fs.writeFile("output/02.html", response.body, function (e) { });

                    var fields = extractFields(response.body);

                    delete fields.btnImprimir;

                    request.post("http://online9.detran.pe.gov.br/ServicosWeb/Veiculo/frmConsultaPlaca.aspx?placa=PGN2681",
                        {
                            form: fields,
                            headers: {
                                "Referer": "http://online4.detran.pe.gov.br/ServicosWeb/Veiculo/frmConsultaPlaca.aspx?placa=PGN2681"
                            },
                            jar: j
                        },
                        function (e, response) {
                            fs.writeFile("output/03.html", response.body, function (e) { });

                            var fields = extractFields(response.body);
                            delete fields.btnLocalizacao;

                            var data = extractVeicleData(response.body);


                            request.post("http://online9.detran.pe.gov.br/ServicosWeb/Veiculo/frmConsultaPlaca.aspx?placa=PGN2681",
                                {
                                    form: fields,
                                    headers: {
                                        "Referer": "http://online4.detran.pe.gov.br/ServicosWeb/Veiculo/frmConsultaPlaca.aspx?placa=PGN2681"
                                    },
                                    jar: j
                                },
                                function (e, response) {
                                    fs.writeFile("output/04.html", response.body, function (e) { });
       
                                    console.log(data);
                                    
                                    //var fields = extractFields(response.body);
                                    //console.log(fields);
        
                                    //console.log(extractVeicleData(response.body));
                                }
                            );
                        }
                    );
                }
            );
        });

    }
)

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
    callback(null, "03ACgFB9voPmCWL5DTTlfemEtD34dSX0wzg_PbFV0eNIAYRYzthhdhb958dkX_R1geFZgWzuLDB2S3gyJ1nA6Pvkc4QOmgo3Jmfiq6sZaUT1D-HKxXLUAfrhdNFMLV5np9UzrVqIFxDixMmA-P3GOCy_5zJ8RzKN0cmbqVIbbjldW0wjX4Hq5AmZQ600fv_p0Sd5B_-cSVR6Pf88ressMQ69wzLBFvjjbmKSJ5oaeFJjxNIbCoyht47Y_WwLxGkntVhvBxbclBLMWejxvSC8usFiR_C5qEnqUJEikIVjkB_SQvDJ7CG_wrCY0dm8sZa_m5D0j6XY02DphTQYf2ybuActubZY5R699gmrEdZ1NDfmUuw4IPVWZl1cj1kvMLMrTyxcJ9wGkgQjUdjRNlx_o3UIWXxLainmnHPRLFZ6R1FDnzJZh_hiTAu_A");
    return;

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