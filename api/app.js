const express = require("express");
const convert = require("xml-js");
const app = express();

const server = app.listen(3005, () => {
  console.log("server start, port 3005");
});

const oracledb = require("oracledb");
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

var request = require("request");
var options = {
  method: "GET",
  url: "http://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList?serviceKey=FT0T1GIASo3H1YMtuIqZIb612ZTiTYOOTyZ0SMTilcHe4DM0xX8iVRPGxyl1e1omWPg0U4tWsYY7p31P%2BtWHFQ%3D%3D&numOfRows=100",
  headers: {},
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  //console.log(response);
  let xmlString = response.body;
  let json = convert.xml2json(xmlString);
  // console.log(json);
  let obj = JSON.parse(json);

  for (let i = 0; i < 100; i++) {
    let ename =
      obj.elements[0].elements[1].elements[3].elements[i].elements[0]
        .elements[0].text;
    let mname =
      obj.elements[0].elements[1].elements[3].elements[i].elements[1]
        .elements[0].text;
    insertData(ename, mname);
  }
});

const dbConfig = {
  user: "team2",
  password: "team2",
  connectString: "43.201.28.219:1521/xe",
};

async function insertData(e, m) {
  let connection;
  try {
    // Oracle DB에 연결
    connection = await oracledb.getConnection(dbConfig);

    // 데이터 삽입 SQL 작성
    const sql = `INSERT INTO 
    medicine (MEDICINE_NO,MEDICINE_NAME,ENTP_NAME) VALUES ((SELECT NVL(MAX(MEDICINE_NO), 0) + 1 FROM medicine), :1, :2)`;
    const binds = [e, m]; // 실제 데이터에 맞게 수정

    // SQL 실행
    const result = await connection.execute(sql, binds);
    await connection.commit();
    console.log(sql);
    console.log(binds);
    console.log("Data inserted successfully:", result);
  } catch (error) {
    console.error("Error inserting data:", error);
  } finally {
    // 연결 해제
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error("Error closing connection:", error);
      }
    }
  }
}
