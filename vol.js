
/*
 * -----------------------------------------------------------------------
 * Kod för volyms- och kvotberäkning
 * -----------------------------------------------------------------------
 */

'use strict';

/*
 * Contrast concentrations for which volume of contrast agent should be displayed
 * Below are all the concentrations of omnipaque and visipaque in FASS - however we only use 320 mg/ml and 350 mg/ml
 */
const kontrastkonc = [  // mg I/ml kontrastmedel
//    140,      // Omnipaque, iohexanol
//    180,      // Omnipaque, iohexanol
//    240,      // Omnipaque, iohexanol
//    270,      // Visipaque, iodixanol
//    300,      // Omnipaque, iohexanol
    320,      // Visipaque, iodixanol
    350,      // Omnipaque, iohexanol
];


/*
 * This is for getting data from the gfr form.
 * This could equally well be done in the resultat1 function, but to have stricter sep of respons I do it here
 * since there may be stuff extra that is needed.
 *
 * Arg1: aGFR (ml/min) (float)
 */
function vol_recgfrdata(agfr) {
    // reset any results
    document.getElementById("res2").innerText = "";
    // set the value of gfr to what we want
    fvol.vol_gfr.value = agfr;
}



/*
 * Calculate and show volumes...
 * Called when submitting the volume form
 * input form values should be correct because of automatic form validation. (Ie should be ok numbers and required fields should be set)
 */
function volymer() {
    const agfr  = parseInt(fvol.vol_gfr.value); 
    const vol  = parseInt(fvol.vol_vol.value); 
    const konc = parseInt(fvol.vol_konc.value); 
    const kvot = parseFloat(fvol.vol_kvot.value); 

    let utstr = "<br/>";
    utstr += "<span class='hl'>aGFR: " + agfr + "</span> ml/min<br>";
    // utstr += "Följande volymer kontrastmedel av angiven koncentration ger kvot 1:<br/>";
    for (const i of kontrastkonc) {   // Here we need to save rounded values since otherwise the displayed values will be wrong
        let v_e = agfr / i;  // volym för kvot 1, exakt. (Note: v_e in uL)
        let v = Math.round(v_e * kvot * 1000);   // volume in ml and according to kvot, rounded
        let mi = (v * i / 1000.0).toFixed(1);   // mass iodine, in g, for ratio kvot
        utstr += "<span class='hl'>&nbsp" + v + " ml </span> kontrast,<span class='hl'> " + i + " mg jod/ml </span>motsvarar " + 
            mi + " g jod, dvs motsvarar kvot " + (mi/agfr).toFixed(1) + " (avrundade värden)<br/>";
    }
    // alert(utstr);

    // if (! isNaN(vol) && ! isNaN(konc) ) {
    if ( isNumber(vol) && isNumber(konc) ) {
        utstr += "<br/>" + vol + " ml kontrast " + konc + " mg jod/ml motsvarar " + (vol * konc / 1000).toFixed(2) + " g jod och ger kvoten: ";
        utstr += (vol * konc / (1000 * agfr)).toFixed(2)  + " vid aGFR: " + agfr + " ml/min <br/>";
    }

    // kvot = konc * vol / agfr
    // if (! isNaN(kvot) && ! isNaN(konc) ) {
    //     utstr += "<br/>" + Math.round(kvot * agfr / konc * 1000) + " ml kontrast " + konc + " mg jod/ml ger kvoten: " + kvot  + "<br/>";
    // }

    const utdiv = document.getElementById("res2");
    utdiv.innerHTML = utstr;
}


