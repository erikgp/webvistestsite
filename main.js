
// Main version of program:
prog_version = "v0.6.2 (2025-11-17)";


/*
 * Function that checks if x is a number.
 * Returns true if x is a number, otherwise false
 * Note: isNaN("") == false, isNaN(null) == false, isNaN("10") == false so can not be used...
 * More spec. NaN is false on every direct comp.
 * Note: isNaN(parseFloat("")) == true, isNaN(parseFloat(null)) == true, but isNaN(parseFloat("10")) = false
 * isFinite() SUCKS as well
 * typeof(NaN) == 'nunber' .....
 * JS really really really SUCKS
 * Will use typeof instead
 */
function isNumber(x) {
    return (typeof(x) === 'number' && ! isNaN(x)) ? true : false;
}


/*
 * Round a number v to n decimals
 * Note Math.round() is a not ok. It always rounds up a+0.5 to a+1, where a is an integer. Math.round is thus biased.
 * js toFixed returns a string...
 * tofixed returns a number
 */
function tofixed(v, n) {
    return Math.round(v * 10**n)/10**n;
}


/*
 * kopierar innheållet i namngivet element x (str, id av element) till clipboard
 */ 
function fcopy(x) {
    const t = document.getElementById(x);
    navigator.clipboard.writeText(t.innerText);
}


/*
 * Kopierar texten s (str) till clipboard
 * Not much use of this unless s is global...
 */
function tcopy(s) {
    navigator.clipboard.writeText(s);
}


/*
 * this is not necessary, but here I set up a collection with names to input element and forms
 * for easier access to the data in the input elements.
 * Will be populated with document.getElementById() for the input elements as well as the forms
 * dont want to use jquery, at least not loaded from a CDN
 */
fgfr = {};
fvol = {};
pd = {};
pfsel = {};
pf = {};
pf2 = {};

/* 
 * Called on initialization of the page.
 * Populates global objects above for easier access to form and input elements on the page
 */
function get_form_elements() {
    fgfr.gfr_form = document.getElementById("gfr_form");
    fgfr.gfr_age = document.getElementById("gfr_age");
    fgfr.gfr_height = document.getElementById("gfr_height");
    fgfr.gfr_weight = document.getElementById("gfr_weight");
    fgfr.gfr_kreat = document.getElementById("gfr_kreat");
    // SEX

    fvol.vol_gfr = document.getElementById("vol_gfr");
    fvol.vol_kvot = document.getElementById("vol_kvot");
    fvol.vol_vol = document.getElementById("vol_vol");
    fvol.vol_konc = document.getElementById("vol_konc");

    pd.pd_form = document.getElementById("pd_form");
    pd.pd_weight = document.getElementById("pd_weight");
    pd.pd_height = document.getElementById("pd_height");
    pd.pd_bmi = document.getElementById("pd_bmi");
    pd.pd_agfr = document.getElementById("pd_agfr");
    pd.pd_rgfr = document.getElementById("pd_rgfr");

    pfsel.pf_proto = document.getElementById("pf_proto");

    pf.pf_form = document.getElementById("pf_form");
    pf.pf_dos = document.getElementById("pf_dos");
    pf.pf_konc = document.getElementById("pf_konc");
    pf.pf_tid = document.getElementById("pf_tid");
    pf.pf_dosh = document.getElementById("pf_dosh");
    pf.pf_maxvikt = document.getElementById("pf_maxvikt");
    pf.pf_maxvol = document.getElementById("pf_maxvol");

    pf2.pf_form2 = document.getElementById("pf_form2");
    pf2.pf_pvol = document.getElementById("pf_pvol");
    pf2.pf_pinjh = document.getElementById("pf_pinjh");
    pf2.pf_pdos = document.getElementById("pf_pdos");
    pf2.pf_pkvot = document.getElementById("pf_pkvot");

}



/*
 * Display warning for old protocols
 */
function display_warning() {
    if ( ! ( typeof protokoll_data_latest === 'undefined' ) ) {
        current_date = new Date();
        protocol_date = new Date(protokoll_data_latest);
        if ( protocol_date.getTime() < current_date.getTime() ) {
            document.getElementById('protocol_warning').style.display = "block";
        }
    }    
}



/*
 * Display version of code
 */
function display_versions() {
    let u = document.getElementById("version");
    let infostr = "Programversion: " + prog_version + "&nbsp;&nbsp;&nbsp;Protokollversion: " + protokoll_data_version;  
    if ( ! ( typeof protokoll_data_latest === 'undefined') ) {
        infostr += "&nbsp;&nbsp;(upphör att gälla: " + protokoll_data_latest + ")";  
    }
    infostr += "<br/><br/>";
    infostr +=    gfr_metod_info + "<br/>";

    u.innerHTML = infostr;
}


/*
 * Function to populate gfr data form input elements with
 * data from get parameters submitted to the page, if
 * any...
 *
 * Unset get parameters will be null i url.searchParams.get. parseInt(null) is NaN
 *
 * This could be done more nincely by using the input element id:s etc.
 */
function getParameters() {
    let url = new URL(location.href);
    let age = parseInt(url.searchParams.get("age"));
    let langd = parseInt(url.searchParams.get("langd"));
    let vikt = parseInt(url.searchParams.get("vikt"));
    let kreat = parseInt(url.searchParams.get("kreat"));
    let sex = parseInt(url.searchParams.get("sex"));

    fgfr.gfr_age.value = isNaN(age) ? "" : age;
    fgfr.gfr_height.value = isNaN(langd) ? "" : langd;
    fgfr.gfr_weight.value = isNaN(vikt) ? "" : vikt;
    fgfr.gfr_kreat.value = isNaN(vikt) ? "" : kreat;

    // fix sex
    if ( ! isNaN(sex) && (sex == 0 || sex == 1) ) {
        let s = document.getElementsByName("gfr_sexbtn");
        s[sex].checked = true;
    }

    let method = url.searchParams.get("method");
    if (method != null) {
        switch (method) {
            /*
            // Not validated
            case "cock":   // :-D
                 kreat_gfr_func = wr_agfr_cockgault;
                 gfr_metod_info = "Estimerat relativt och absolut GFR baserat på kreatinin och estimerat aGFR enl. Cockcroft Gault.";
                 break;
             */
            case "lm-lbm":
                 kreat_gfr_func = wr_agfr_lm;
                 gfr_metod_info = "Estimerat relativt och absolut GFR baserat på kreatinin och estimerat aGFR enl. Lund-Malmö med lean body mass.";
                 break;
            case "lm-rev":
                 kreat_gfr_func = wr_rgfr_revlm;
                 gfr_metod_info = "Estimerat relativt och absolut GFR baserat på kreatinin och estimerat rGFR enl. den reviderade Lund-Malmö-metoden.";
                 break;
            /*
            // Not validated
            case "mdrd":
                kreat_gfr_func = wr_rgfr_mdrd;
                 gfr_metod_info = "Estimerat relativt och absolut GFR baserat på kreatinin och estimerat rGFR enl. MDRD-IDMS.";
                 break;
            // Not validated
            case "ckd":
                kreat_gfr_func = wr_rgfr_ckd_kreat;
                 gfr_metod_info = "Estimerat relativt och absolut GFR baserat på kreatinin och estimerat rGFR enl. CKD-EPI_KREA.";
                 break;
            */
        }
    } 

    let calc_gfr = parseInt(url.searchParams.get("calc"));
    if ( calc_gfr == 1 ) {
        gfr_submit_gfrform_val();
    }
}


