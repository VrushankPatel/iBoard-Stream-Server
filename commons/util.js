const devIdentifier = "aHR0cDovL2xvY2FsaG9zdDo1MDAwL2FwaS9pQm9hcmRJbnNlcnRQYXlMb2Fk"
const encodedIdentifier1 = "aHR0cHM6Ly9pYm9hcmR4Lmhlcm9rdWFwcC5jb20vYXBpL2lCb2FyZEluc2VydFBheUxvYWQ=";
const encodedIdentifier2 = "aHR0cHM6Ly9pYm9hcmQtc2VydmVyMi5oZXJva3VhcHAuY29tL2FwaS9pQm9hcmRJbnNlcnRQYXlMb2Fk";

const getUrlByGMTFn = () => {
    const currentDate = new Date().getDate();
    if (currentDate <= 15) return encodedIdentifier1;
    else return encodedIdentifier2;
}
const util = { 
    getUrlByGMT: getUrlByGMTFn()    
};


export default util;