
/*
 * Kod för gfr-beräkning
 */

/*
 * NOTE! 
 * A function "pointer" (set elsewhere) is used to calc gfr from kreat and data
 * For all functions to calculate gfr there are function wrappers with the same interface 
 * and returning the same kind of values (agfr, rgfr, and body surface area).
 * (The same function signature...)
 */


/*
 * There is a small risk that the values in the gfr form does not correspond to the values used to
 * calculate rgfr and agfr (ie the calculated gfr values seem to be ok and correspond to the values
 * in the form, when actually they don't).
 * We need to save the actual values used to calculate gfr as well as the calculated bmi and gfr values
 */
const res = {
    age: NaN,                 // age, from form
    rev_age: NaN,             // revised age, for children <18, this will be set to 18, for age>=18 this is will be set to the age
    langd: NaN,               // height, in cm, from form
    vikt: NaN,                // weight, in kg, from form
    kreatinin: NaN,           // actual kreatinin in umol/L, from form
    rev_kreatinin: NaN,       // revised kreatinin, for children <18, this will be set to a value based on age etc, for age >= 18 is will be setg to kreatining
    sex: 0,                   // female == 0, male == 1
    // Calculated values below
    rev: false,               // if revised age and kreat is used (children), ie if the revised values differ from the non revised value, ie if age < 18
    rgfr: NaN,                // rounded value of rgfr - note javascript does not round in a nice way
    rgfr_e: NaN,              // "exact" value of rgfr
    agfr: NaN,
    agfr_e: NaN,
    bmi: NaN,                 // rounded value of bmi
    bmi_e: NaN,               // exacet value of bmi
    bmi_s: "",                // rounded value of bmi, as a string. Not number.toFixed() returns a string, and this "40" < "5" == true
    ky: NaN,
    ky_e: NaN,
    ky_s: "",
    // The values below are mostly not used, but could be nice to have in protocol specific functions.
    calculated_gfr: false,    // if gfr values are consistent with other data in res such as age, langd etc (this implies bmi, ky is also consistent)
    calculated_bmi: false,    // if the bmi value is consistent with other data in the form, ie with langd and vikt) (this implies vikt is alos consistent)
    calculated_vikt: false,   // if the vikt value is consistent with the vikt value in the form - should always be the case...
    up2date: false            // if the data in the res object is up to date relative form data. If the form is updated and not recalculated this should be set to false
}

// If we have data in the res1 div or not
res1_filled = false;


/*
 * populate res global with values from gfr form input elements
 * Note: input form elements are populatad in script in html file. For example: fgfr.gfr_age corresponds to document.getElementById("gfr_age") etc
 * Note: basic check for numbers
 */
function gfr_get_vals() {
    res.age = parseInt(fgfr.gfr_age.value);       // NaN if not parsable to int
    // res.rev_age = res.age;                         // initial value
    res.langd = parseInt(fgfr.gfr_height.value);
    res.vikt = parseInt(fgfr.gfr_weight.value);
    res.kreatinin = parseInt(fgfr.gfr_kreat.value);
    // res.rev_kreatinin = res.kreatinin;             // initial value
    res.sex = parseInt(document.querySelector('input[name="gfr_sexbtn"]:checked').value);
}


/*
 * prog. submit gfr form - if sumbitted from code and when input validation is needed (a form sumbitted from code is not validated)
 */
function gfr_submit_gfrform_val() {
    if ( fgfr.gfr_form.checkValidity() ) gfr_submit_gfr_form();
}


/*
 * Function called when the gfr form i submitted.
 * Note that we can expect the values in the form to exist and be valid because of auto form validation.
 * 1. Calculates rgfr, agfr, body area, and bmi from form data (calling other funcs)
 * 2. Calls the function resultat1 to show results
 */
function gfr_submit_gfr_form() {
    // clear old result - should not be necessary...
    // gfr_resetgfrdata();

    // populate part of the global res object with values from gfr form
    gfr_get_vals();

    res.up2date = true;
    res.calculated_gfr = false;
    res.calculated_bmi = false;
    res.calculated_vikt = false;


    // only weight is required!
    // The following are allowed: (weight), (height, weight), (age, height, weight, kreat, sex).
    // No other combinations are allowed, except sex is always submitted. Weight is guaranteed from form validation

    // All values submitted? sex is always submitted.
    if ( ! isNaN(res.age) && ! isNaN(res.langd) && ! isNaN(res.vikt)  && ! isNaN(res.kreatinin) ) {   // we have all data! Sex should always be selected
                                                                                                      // NaN is falsy


        if (res.age < 18) { // form validation should ensure age >= 2
            let alertstring = "Aktuell metod bör användas med försiktighet för barn >= 2 år och yngre än 18 år, och för barn endast tillsammans med den reviderade LM-metoden.\n" +
                   "Metoden beräknar ett till 18 år justerat kreatininvärde som sedan används tillsammans med REV-LM-metoden och 18 år.\n" +
                   "aGFR från rGFR bör tolkas ytterligt försiktigt, och metoden är ej validerad för detta.\n" +
                   "Se Läkartidningen. 2021;118:20134";
            alert(alertstring);
            res.rev_kreatinin = rev_kreat_child(res.age, res.kreatinin, res.sex);
            res.rev_age = 18;
            res.rev = true;
        }
        else {
            res.rev_kreatinin = res.kreatinin;
            res.rev_age = res.age;
            res.rev = false;
        }

        // get rGFR according to current method according to function pointer
        // let [temp_agfr, temp_rgfr, ky] = kreat_gfr_func(res.rev_age, res.vikt, res.langd, res.rev_kreatinin, res.sex, 0);
        let [temp_agfr, temp_rgfr, ky] = [0, 0, 0];

        // always rev-lm as lm-method for children - se LT
        if ( res.age < 18 ) {
            [temp_agfr, temp_rgfr, ky] = wr_rgfr_revlm(res.rev_age, res.vikt, res.langd, res.rev_kreatinin, res.sex, 0);
        }
        else {
            [temp_agfr, temp_rgfr, ky] = kreat_gfr_func(res.rev_age, res.vikt, res.langd, res.rev_kreatinin, res.sex, 0);
        }

        // bmi
        let bmi = calc_bmi(res.vikt, res.langd);

        // populate res global with calculated values
        res.rgfr_e = temp_rgfr;
        res.rgfr = Math.round(temp_rgfr);

        res.agfr_e = temp_agfr;
        res.agfr = Math.round(temp_agfr);

        res.ky_e = ky;
        res.ky_s = ky.toFixed(2);
        res.ky = tofixed(ky, 2);

        res.bmi_e = bmi;
        res.bmi_s = bmi.toFixed(1);
        res.bmi = tofixed(bmi, 1);

        res.calculated_gfr = true;
        res.calculated_bmi = true;
        res.calculated_vikt = true;

        gfr_resultat1();

        // since data here is changed, the data in the pf form may not be current - clear inj parameters and decision
        prot_pdform_populate(res);
        prot_reset_pf_forms();
        prot_recalc();
        // clear gfr etc in vol form
        vol_recgfrdata(res.agfr);

        return;
    }
    else if ( ! isNaN(res.langd) && ! isNaN(res.vikt) ) {  // enough data for bmi calculations submitted.
                                                           // weight guaranteed by form validation
                                                           // We could calc body surface area here as well, but we dont
        res.bmi_e = calc_bmi(res.vikt, res.langd);
        res.bmi_s = res.bmi_e.toFixed(1);
        res.bmi = tofixed(res.bmi_e, 1);

        res.calculated_bmi = true;
        res.calculated_vikt = true;

        gfr_resultat2();

        // since data here is changed, then data in the pf form may not be current - clear inj parameters and decision
        prot_pdform_populate(res);
        prot_reset_pf_forms();
        prot_recalc();

        return;
    }
    else if ( res.vikt ) {
        res.calculated_vikt = true;

        prot_pdform_populate(res);
        prot_reset_pf_forms();
        prot_recalc();

        return;
    }
}



/*
 * Displays the data in the res global containing gfr, body area and bmi.
 * Generally called from gfr_submit_gfr_form()
 */
function gfr_resultat1() {
    res1_filled = true;
    const ut = document.getElementById("res1");

    // snygg text
    let stext = res.sex == 1 ? "Man " : "Kvinna ";
    stext += res.age + " år. " + res.langd + " cm. " + res.vikt + " kg. Kreatinin: " + res.kreatinin + " μmol/L.";
    if ( res.rev ) 
        stext += " Reviderat kreatinin: " + Math.round(res.rev_kreatinin) + " μmol/L.\n";
    else
        stext += "\n";
    stext += "BMI: " + res.bmi_s + " kg/m^2\n";
    stext += "aGFR: " + res.agfr + " ml/min.  rGFR: " + res.rgfr + " ml/(min*1.73m^2) (estimerade värden)";
    document.getElementById("copy-hidden").textContent = stext;

    // snabblänk att skicka... location.href är inkl ev get-parametrar
    let ltext = (res.sex == 1 ? "Man" : "Kvinna") + " " + res.age + " år.  " + res.langd + " cm.  " + res.vikt + " kg.";
    ltext += " Kreatinin: " + Math.round(res.kreatinin) + ".";
    if ( res.rev )
        ltext += " revKreatinin: " + Math.round(res.rev_kreatinin) + ".";
    ltext += "\nBMI: " + res.bmi_s + "\n";
    ltext += "\aGFR: " + res.agfr + "    rGFR: " + res.rgfr + "\n";
    ltext += location.origin + location.pathname + "?age=" + res.age + "&langd=" + res.langd + "&vikt=" + res.vikt +
             "&kreat=" + res.kreatinin + "&sex=" + res.sex + "&calc=1";
    document.getElementById("copy1").textContent = ltext;

    // display text
    let utstr = "";
    // utstr = "Resultat:<br/>";
    utstr += res.sex == 1 ? "Man " : "Kvinna ";
    utstr += res.age + " år, längd: " + res.langd + " cm, vikt: " + res.vikt + " kg, kreatinin " + res.kreatinin + " μmol/L<br/>";
    if ( res.rev ) {
        utstr += "<span class='hl'>OBS! Den reviderade-LM-metoden har använts för beräkning av rGFR då personen är under 18 år.<br/>";
        utstr += "aGFR har erhållits från rGFR efter beräkning av kroppsyta enligt du Bois och du Bois.</span><br/>";
        utstr += "Reviderat kreatinin: " + Math.round(res.rev_kreatinin) + " μmol/L <br/>";
    }
    if (res.bmi > 40) {
        utstr += "<span class='hl'>Formlerna är inte tillräckligt validerade för patienter med BMI > 40. Skattade värden bör tolkas med försiktighet.</span><br/>";
    }
    utstr += "Absolut GFR (aGFR): <span class='hl'>&nbsp;" + res.agfr + " </span> ml/min (estimerat)<br/>";
    utstr += "Relativt GFR (rGFR): <span class='hl'>&nbsp;" + res.rgfr + " </span> ml/(min * 1.73 m<sup>2</sup>) (estimerat)<br/>";
    utstr += "BMI: <span class='hl'>&nbsp;" + res.bmi_s + " </span>kg/m<sup>2</sup><br/>";
    utstr += "Kroppsyta: " + res.ky_s + " m<sup>2</sup> (estimerat)<br/><br/>";
    // utstr += "<button onclick='fcopy(\"copy-hidden\");'>Kopiera</button><br/>";
    utstr += "<button onclick='fcopy(\"copy-hidden\");'>Kopiera</button> &nbsp&nbsp";
    utstr += "<button onclick='fcopy(\"copy1\");'>Kopiera koncis + länk</button>";
    ut.innerHTML=utstr;
}

/*
 * Display bmi
 */
function gfr_resultat2() {
    res1_filled = true;
    const ut = document.getElementById("res1");

    // snygg text
    let stext = res.langd + " cm. " + res.vikt + " kg.";
    stext += "BMI: " + res.bmi_s + " kg/m^2\n";
    document.getElementById("copy-hidden").textContent = stext;

    let utstr = "";
    // utstr = "Resultat:<br/>";
    utstr += "Längd: " + res.langd + " cm, vikt: " + res.vikt + " kg<br/>";
    utstr += "BMI: <span class='hl'>&nbsp;" + res.bmi_s + " </span>kg/m<sup>2</sup><br/>";
    utstr += "<button onclick='fcopy(\"copy-hidden\");'>Kopiera</button>";
    ut.innerHTML=utstr;
}


/*
 * Called on change of the gfr form data
 * Set on the form (and changes in input elements bubble up to this)
 */
function gfr_change(e) {
    let el = e.target;

    res.up2date = false;
    gfr_clear_gfr();

    // if ( ! el.checkValidity() ) {
    if ( ! el.validity.valid ) {
        alert( "Heltalsvärde med: " + el.min + " ≤ värde ≤ " + el.max);
        el.value = "";
        el.focus();
    }

    // We could recalculate all gfr stuff from here, but it would probably be annoying

    // TODO PD --- THis MUST be done if we dont show the pd form!
    // prot_reset_pf_forms();
    // prot_reset_pd_form();

}


/* reset gfr "calculations" (sets calculated to false in gl and res global vars and clear display of result when changing values in gfr form
 * Called on "onchange" on all gfr form input elements
 * Arg1: rensa (boolean) - if true, clears the gfr form
 */
function gfr_resetgfrdata(rensa) {
    gfr_clear_gfr();

    res.up2date = false;

    // we also need to clear the protokoll
    // We could recalculate the protokoll form but that would probably be annoying...
    // TODO PD --- THis MUST be done if we dont show the pd form!
    // prot_reset_pf_forms();
    // prot_reset_pd_form();

    if (rensa) {
        fgfr.gfr_form.reset();
    }
}


/*
 * This functions clears the displayed gfr info
 */
function gfr_clear_gfr() {
    if (res1_filled) {
        document.getElementById("res1").innerText = "";
        document.getElementById("copy-hidden").innerText = "";
        document.getElementById("copy1").innerText = "";
    }
    res1_filled = false;

    return;
}



