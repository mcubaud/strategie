///affichage de la carte
mymap = L.map('mapid').setView([45.847,4.788], 15);
layer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom: 22, maxNativeZoom :19,
}).addTo(mymap);
Icone = L.Icon.extend({
    options: {
        shadowUrl: '',
        iconSize:     [60, 95],
        shadowSize:   [50, 64],
        iconAnchor:   [22, 94],
        shadowAnchor: [4, 62],
        popupAnchor:  [-3, -76]
    }
});

//Récupération des objets sur le serveur
var requestURL = 'https://mdn.github.io/learning-area/javascript/oojs/json/superheroes.json';
var request = new XMLHttpRequest();
request.open('GET', requestURL);
request.responseType = 'json';
request.send();
request.onload = function() {
    var superHeroes = request.response;
    console.log(superHeroes);
}







//group contient tous les marqueurs, avec un marqueur par unité.
group=L.featureGroup().addTo(mymap);

document.getElementById("music").play();
document.getElementById("music").loop=true;
volume=document.getElementById("volume");
volume.addEventListener("click",function(e){
    volume.value=Math.ceil((e.x-volume.offsetLeft)/volume.clientWidth*100);
    ["music","combat"].forEach(element=>{
        document.getElementById(element).volume=(e.x-volume.offsetLeft)/volume.clientWidth;
    });
});

document.getElementById("Quitter").addEventListener("click",e=>{
    window.location.href="..";
})

listeUnitesPresentes=[];
listeUnitesSelectiones=[];
batiment_selectionne=null;
current_id=0;
Last_Selected_Unit=null;
prix_bois=0;
prix_or=0;
prix_food=0;
vitesse_de_jeu=3000;
frequence_attaques=5000;

player={
    name : "player",
    score : 0,
    food : 1000,
    wood : 1000,
    gold : 1000,
    phrase : "A vos ordres !",
    listener : FriendListener,
    liste_base:[{
        lat:45.84,
        lng:4.78,
    }]
    
}

ennemy={
    name: "ennemy",
    score : 0,
    food : 1000,
    wood : 1000,
    gold : 1000,
    phrase : "Grr !!!",
    listener : EvilListener,
    compte: 1,
    wood_production:0,
    food_production:0,
    gold_production:0,
    liste_base:[{
        lat:45.849,
        lng:4.790
    }],
    nb_batiments:1,
    a_le_droit_de_jouer:true,
    a_le_droit_de_lancer_une_attaque:true
}

base={
    pv:1000,
    vitesse:0,
    attaque:100,
    portee:0.0003,
    portee_vue:0.0005,
    type:"building",
    classe:"base",
    boutons:[boutons_creer_soldats,bouton_creer_archer],
    noms_boutons:["soldat","archer"],
    wood_production:0,
    food_production:0,
    gold_production:0,
    image: "caserne"
}
scierie={
    pv:500,
    vitesse:0,
    attaque:0,
    portee:0.0005,
    portee_vue:0.0005,
    type:"building",
    classe:"scierie",
    boutons:[bouton_ameliorer_production],
    noms_boutons:["Améliorer"],
    wood_production:1,
    food_production:0,
    gold_production:0,
    image: "scierie"
}
mine={
    pv:500,
    vitesse:0,
    attaque:0,
    portee:0.0005,
    portee_vue:0.0005,
    type:"building",
    classe:"mine",
    boutons:[bouton_ameliorer_production],
    noms_boutons:["Améliorer"],
    wood_production:0,
    food_production:0,
    gold_production:1,
    image: "mine"
}
ferme={
    pv:500,
    vitesse:0,
    attaque:0,
    portee:0.0005,
    portee_vue:0.0005,
    type:"building",
    classe:"ferme",
    boutons:[bouton_ameliorer_production],
    noms_boutons:["Améliorer"],
    wood_production:0,
    food_production:1,
    gold_production:0,
    image: "ferme"
}

soldat={
    pv:100,
    vitesse:0.0001,
    portee:0.0005,
    attaque:10,
    faction:player,
    type:"unit",
    classe:"soldat",
    portee_vue:0.003,
    image: "templier"
}
archer={
    pv:50,
    vitesse:0.0001,
    portee:0.002,
    attaque:10,
    faction:player,
    type:"unit",
    classe:"archer",
    portee_vue:0.004,
    image: "archer"
}

function creerUnite(x,y,pv=100,vitesse=0.0001,portee=0.0005,attaque=10,faction=player,type="unit",portee_vue=0.003,image="templier",classe="inconnue"){
    var stat_unite={
        id : current_id,
        type : type,
        faction : faction,
        pv_initiaux : pv,
        pv : pv,
        vitesse : vitesse,
        portee : portee,
        portee_vue : portee_vue,
        attaque : attaque,
        type_ordre : "",
        cible : null ,
        ordre_position : null,
        classe : classe
    }
    var markerUnite= L.marker([x,y]).addTo(group);
    markerUnite.stat_unite=stat_unite;
    listeUnitesPresentes.push(markerUnite);
    current_id+=1;
    markerUnite.addEventListener("click",function(){faction.listener(markerUnite)});
    markerUnite.bindPopup(faction.phrase);
    var image= new Icone({iconUrl: "images/"+image+"_"+faction.name+".png"});
    markerUnite.setIcon(image);
    return markerUnite;
}
function creerUnite_classe_definie(x,y,faction,archetype){
    return creerUnite(x,y,archetype.pv,archetype.vitesse,archetype.portee,archetype.attaque,faction,archetype.type,archetype.portee_vue,archetype.image,archetype.classe);

}

function FriendListener(markerUnite){
    if(markerUnite.stat_unite.type=="unit"){
        listeUnitesSelectiones.push(markerUnite);
        afficher_info_unite(markerUnite);
    }
    else if(markerUnite.stat_unite.type=="building"){
        afficher_info_batiment(markerUnite);
    }
}
function EvilListener(markerUnite){
    faireAttaquerUnitesSelectionnees(markerUnite);
    afficher_info_unite(markerUnite);
}

function faireAttaquerUnitesSelectionnees(unite_cible){
    console.log("ordre d'attaque donné");
    if (listeUnitesSelectiones.length!=0){
        listeUnitesSelectiones.forEach(unite => {
            unite.bindPopup("A l'attaque !").openPopup();
            unite.stat_unite.type_ordre="attaquer";
            unite.stat_unite.ordre_position=unite_cible.getLatLng();
            unite.stat_unite.cible=unite_cible;
            setTimeout(function(){
                unite.closePopup();
                unite.bindPopup("À vos ordres !");
            },500);
        });
        listeUnitesSelectiones=[];
    }
}

function faireAttaquer(unite_attaquante,unite_cible){
    unite_attaquante.stat_unite.type_ordre="attaquer";
    unite_attaquante.stat_unite.ordre_position=unite_cible.getLatLng();
    unite_attaquante.stat_unite.cible=unite_cible;
}

mymap.addEventListener("click",function(e){
    if (batiment_selectionne!=null){
        var batiment=creerBatiment(e.latlng,batiment_selectionne,player);
        if (batiment_selectionne==base){
            player.liste_base.push(e.latlng);
        }
        batiment_selectionne=null;
    }
    else{
        if (listeUnitesSelectiones.length!=0){
            listeUnitesSelectiones.forEach(unite => {
                unite.bindPopup("Je le ferait !").openPopup();
                if(e.latlng!=null){
                    unite.stat_unite.type_ordre="deplacement";
                    unite.stat_unite.ordre_position=e.latlng;
                }else{
                    console.log("problème de clic?")
                }
                setTimeout(function(){
                    unite.closePopup();
                    unite.bindPopup("À vos ordres !");
                },500);
            });
            listeUnitesSelectiones=[];
        }
    }
    
});

function creerBatiment(latlng,type_batiment,faction){
    var batiment=creerUnite_classe_definie(latlng.lat,latlng.lng,faction,type_batiment);
    batiment.boutons=type_batiment.boutons;
    batiment.noms_boutons=type_batiment.noms_boutons;
    batiment.wood_production=type_batiment.wood_production;
    batiment.food_production=type_batiment.food_production;
    batiment.gold_production=type_batiment.gold_production;
    return batiment
}

function boucle_du_jeu(){
    musique_combat=false;
    etablir_strategie_ennemie();
    var compte_allie=0;
    var compte_ennemie=0;
    listeUnitesPresentes.forEach(unite=>{
        if(unite.stat_unite.pv<=0){
            //on retire l'unité de l'ensemble des unités présentes
            listeUnitesPresentes=listeUnitesPresentes.filter(u=>(u!=unite));
            if(unite.stat_unite.classe=="base"){
                console.log("base détruite !");
                unite.stat_unite.faction.liste_base=unite.stat_unite.faction.liste_base.filter(position_base=>(position_base.lat!=unite.getLatLng().lat));
            }
            unite.remove();
        }
        else{
            if (unite.stat_unite.faction==player){
                compte_allie++;
            }else{
                compte_ennemie++;
            }
            if(unite.stat_unite.type_ordre!=""){
                effectuer_ordre(unite);
            }else{
                trouver_occupation(unite);
            }
            if (unite.stat_unite.type=="building"){
                FaireProduire(unite);
            }
        } 
    })
    ennemy.compte=compte_ennemie;
    document.getElementById("score").innerHTML="score : "+player.score;
    document.getElementById("nourriture").innerHTML="nourriture : "+player.food;
    document.getElementById("bois").innerHTML="bois : "+player.wood;
    document.getElementById("or").innerHTML="or : "+player.gold;
    if(musique_combat){
        document.getElementById("music").pause();
        document.getElementById("combat").play();
    }else{
        document.getElementById("music").play();
        document.getElementById("combat").pause();
    }
    if(Last_Selected_Unit!=null){
        if(Last_Selected_Unit.stat_unite.type=="unit"){
            afficher_info_unite(Last_Selected_Unit);
        }
    }
    if(compte_allie==0 || compte_ennemie==0){
        if(compte_ennemie==0){
            alert("Victoire !!!\n Score : "+player.score+"\n Score ennemie : "+ennemy.score);
        }else{
            alert("Défaite !\n Score : "+player.score+"\n Score ennemie : "+ennemy.score);
        }
        window.location.href=".";
    }else{
        setTimeout(boucle_du_jeu,100);
    }
}

function effectuer_ordre(unite){
    let type_ordre=unite.stat_unite.type_ordre;
    if(type_ordre=="deplacement"||type_ordre=="patrouiller"){
        deplacer(unite);
    }
    if(type_ordre=="attaquer"){
        attaque(unite);
    }
}

function attaque(unite){
    let latlng=unite.getLatLng();
    let latlng_cible=unite.stat_unite.cible.getLatLng();
    let distance=Math.sqrt((latlng.lat-latlng_cible.lat)*(latlng.lat-latlng_cible.lat)+(latlng.lng-latlng_cible.lng)*(latlng.lng-latlng_cible.lng));
    if (distance>unite.stat_unite.portee){
        //On est trop loin, on se rapproche
        unite.stat_unite.ordre_position=latlng_cible;
        deplacer(unite);
    }
    else{
        combattre(unite);
    }
}

function combattre(unite){
    musique_combat=true;
    let cible=unite.stat_unite.cible;
    if (cible.stat_unite.pv<=0){
        unite.stat_unite.type_ordre="";
        unite.stat_unite.cible=null;
    }
    else{
        cible.stat_unite.pv-=unite.stat_unite.attaque*Math.random();
        //console.log(cible.stat_unite.id+" : "+cible.stat_unite.pv);
        if (cible.stat_unite.cible==null){
            cible.stat_unite.cible=unite;
            cible.stat_unite.type_ordre="attaquer";
        }
        if (cible.stat_unite.pv<=0){
            unite.stat_unite.faction.score+=cible.stat_unite.pv_initiaux;
        }
    }
    
    
}

function deplacer(unite){
    let lat=unite.getLatLng().lat;
    let lng=unite.getLatLng().lng;
    if (unite.stat_unite.ordre_position==null){
        unite.stat_unite.type_ordre="";
    }else{
        let lat_ordre=unite.stat_unite.ordre_position.lat;
        let lng_ordre=unite.stat_unite.ordre_position.lng;
        let distance=Math.sqrt((lat_ordre-lat)*(lat_ordre-lat)+(lng_ordre-lng)*(lng_ordre-lng));
        if (distance<unite.stat_unite.vitesse){
            distance=unite.stat_unite.vitesse;
            unite.stat_unite.ordre_position=null;
            if (unite.stat_unite.cible==null){
                unite.stat_unite.type_ordre="";
            }
        }
        let nlat=lat+unite.stat_unite.vitesse*(lat_ordre-lat)/distance;
        let nlng=lng+unite.stat_unite.vitesse*(lng_ordre-lng)/distance;
        unite.setLatLng([nlat,nlng]);
    }
    
}


function trouver_occupation(unite){
    let listeEnnemisProches=[];
    let listeDistances=[];
    let numero=0;
    var latlng=unite.getLatLng();
    listeUnitesPresentes.forEach(unite2=>{
        if (unite2.stat_unite.faction!=unite.stat_unite.faction){
            //unite2 est un ennemi
            let latlng_cible=unite2.getLatLng();
            let distance=Math.sqrt((latlng.lat-latlng_cible.lat)*(latlng.lat-latlng_cible.lat)+(latlng.lng-latlng_cible.lng)*(latlng.lng-latlng_cible.lng));
            if (distance<unite.stat_unite.portee_vue){
                //l'unite est visible, on pourrait encore rajouter un niveau en vérifiant si l'ennemi est plus faible
                listeEnnemisProches.push(unite2);
                listeDistances.push([distance,numero]);
                numero++;
            }
        }
    });
    if(numero!=0){
        let argMin=listeDistances.sort()[0][1];
        faireAttaquer(unite,listeEnnemisProches[argMin]);
    }else{
        //Il n'y a pas d'ennemi proche, on va donc patrouiller.
        unite.stat_unite.type_ordre="patrouiller";
        let nlat=latlng.lat+(Math.random()-0.5)*unite.stat_unite.portee;
        let nlng=latlng.lng+(Math.random()-0.5)*unite.stat_unite.portee;
        unite.stat_unite.ordre_position={lat: nlat,lng: nlng};
        if(unite.stat_unite.ordre_position==null){
            unite.stat_unite.type_ordre="";
            console.log("échec du patrouillage");
        }
    }
}

function afficher_info_unite(unite){
    div_info=document.getElementById("caracteristiques");
    div_info.replaceChildren();
    document.getElementById("actions").replaceChildren();
    let string="id : "+unite.stat_unite.id+"; ";
    string+="type : "+unite.stat_unite.type+"; ";
    string+="faction : "+unite.stat_unite.faction.name+"; ";
    string+="pv: "+unite.stat_unite.pv+"/"+unite.stat_unite.pv_initiaux+"; ";
    string+="vitesse : "+unite.stat_unite.vitesse+"; ";
    string+="attaque : "+unite.stat_unite.attaque+"; ";
    string+="portee : "+unite.stat_unite.portee+"; ";
    string+="portee de vue : "+unite.stat_unite.portee_vue+"; ";
    let text=document.createTextNode(string);
    div_info.appendChild(text);
    Last_Selected_Unit=unite;
}

function afficher_info_batiment(unite){
    div_info=document.getElementById("caracteristiques");
    div_info.replaceChildren();
    div_actions=document.getElementById("actions")
    div_actions.replaceChildren();
    let string="id : "+unite.stat_unite.id+"; ";
    string+="type : "+unite.stat_unite.type+"; ";
    string+="faction : "+unite.stat_unite.faction.name+"; ";
    string+="pv: "+unite.stat_unite.pv+"/"+unite.stat_unite.pv_initiaux+"; ";
    string+="attaque : "+unite.stat_unite.attaque+"; ";
    string+="portee : "+unite.stat_unite.portee+"; ";
    string+="production de bois : "+unite.wood_production+"; "
    string+="production de nourriture : "+unite.food_production+"; "
    string+="production d'or : "+unite.gold_production+"; "
    let text=document.createTextNode(string);
    div_info.appendChild(text);
    Last_Selected_Unit=unite;
    for (var i=0;i<unite.boutons.length;i++){
        let bouton=document.createElement("button");
        bouton.innerHTML=unite.noms_boutons[i];
        div_actions.appendChild(bouton);
        x=unite.getLatLng().lat+(Math.random()-0.5)*soldat.portee;
        y=unite.getLatLng().lng+(Math.random()-0.5)*soldat.portee;
        bouton.addEventListener("click",unite.boutons[i]);
    }

}

function FaireProduire(batiment){
    let joueur=batiment.stat_unite.faction;
    joueur.gold+=batiment.gold_production;
    joueur.wood+=batiment.wood_production;
    joueur.food+=batiment.food_production;
}



///Les boutons de création des != types de batiments
document.getElementById("base").addEventListener("click",function(){
    if(player.wood>=500){
        player.wood-=500;
        batiment_selectionne=base;
    }
});
document.getElementById("scierie").addEventListener("click",function(){
    if(player.wood>=100){
        player.wood-=100;
        batiment_selectionne=scierie;
    }
});
document.getElementById("mine").addEventListener("click",function(){
    if(player.wood>=100){
        player.wood-=100;
        batiment_selectionne=mine;
    }
});
document.getElementById("ferme").addEventListener("click",function(){
    if(player.wood>=100){
        player.wood-=100;
        batiment_selectionne=ferme;
    }
});

function boutons_creer_soldats(){
    if (player.gold>100 && player.food>100){
        player.gold-=100;
        player.food-=100;
        var unite=creerUnite(x,y,soldat.pv,soldat.vitesse,soldat.portee,soldat.attaque,player,"unit",soldat.portee_vue);
        return unite
    }
    else{
        console.log("Trop pauvre !");
    }
}

function bouton_creer_archer(){
    if (player.gold>100 && player.food>100){
        player.gold-=100;
        player.food-=100;
        var unite=creerUnite_classe_definie(x,y,player,archer);
        return unite
    }
    else{
        console.log("Trop pauvre !");
    }
}

function bouton_ameliorer_production(){
    if(player.gold>=200){
        console.log("amélioration");
        Last_Selected_Unit.stat_unite.faction.gold-=200;
        Last_Selected_Unit.wood_production*=1.1;
        Last_Selected_Unit.food_production*=1.1;
        Last_Selected_Unit.gold_production*=1.1;
        afficher_info_batiment(Last_Selected_Unit);
    }
    else{
        console.log("sale pauvre");
    }
}

function etablir_strategie_ennemie(){
    if(ennemy.a_le_droit_de_jouer && ennemy.liste_base.length!=0){
        ennemy.a_le_droit_de_jouer=false;
        if (ennemy.compte>1.5*ennemy.nb_batiments){
            var faiblesse=[ennemy.food_production,ennemy.wood_production,ennemy.gold_production].lastIndexOf(Math.min(ennemy.food_production,ennemy.wood_production,ennemy.gold_production));
            var position_ou_construire={
                lat: ennemy.liste_base[0].lat+ennemy.nb_batiments*0.0006*Math.cos(ennemy.nb_batiments/6*Math.PI),
                lng: ennemy.liste_base[0].lng+ennemy.nb_batiments*0.0006*Math.sin(ennemy.nb_batiments/6*Math.PI)
            }
            if(faiblesse==0){
                if (ennemy.wood>=100){
                    ennemy.wood-=100;
                    creerBatiment(position_ou_construire,ferme,ennemy);
                    ennemy.food_production+=ferme.food_production;
                    ennemy.nb_batiments++;
                }
            }else if(faiblesse==1){
                if (ennemy.wood>=100){
                    ennemy.wood-=100;
                    creerBatiment(position_ou_construire,scierie,ennemy);
                    ennemy.wood_production+=scierie.wood_production;
                    ennemy.nb_batiments++;
                }
            }else{
                if (ennemy.wood>=100){
                    ennemy.wood-=100;
                    creerBatiment(position_ou_construire,mine,ennemy);
                    ennemy.gold_production+=mine.gold_production;
                    ennemy.nb_batiments++;
                }
            }
        }else if(ennemy.gold>=100 && ennemy.food>=100){
            ennemy.gold-=100;
            ennemy.food-=100;
            var x=ennemy.liste_base[0].lat+(Math.random()-0.5)*soldat.portee;
            var y=ennemy.liste_base[0].lng+(Math.random()-0.5)*soldat.portee;
            if(Math.random()*2>1){
                creerUnite_classe_definie(x,y,ennemy,soldat);
            }else{
                creerUnite_classe_definie(x,y,ennemy,archer)
            }
        }
    if(ennemy.compte-ennemy.nb_batiments>2 && ennemy.a_le_droit_de_lancer_une_attaque){
        lancer_raid((ennemy.compte-ennemy.nb_batiments)/2);
        ennemy.a_le_droit_de_lancer_une_attaque=false;
        setTimeout(function(){
            ennemy.a_le_droit_de_lancer_une_attaque=true;
        },frequence_attaques)
    }
    setTimeout(function(){
        ennemy.a_le_droit_de_jouer=true;
    },vitesse_de_jeu);    
        
    }
    
}

function lancer_raid(nombre_de_soldats_envoyes=2){
    var soldats_envoyes=0
    listeUnitesPresentes.forEach(unite=>{
        if (unite.stat_unite.faction==ennemy && unite.stat_unite.type=="unit" && unite.stat_unite.type_ordre=="patrouiller"&&soldats_envoyes<nombre_de_soldats_envoyes){
            if(player.liste_base.length!=0){
                unite.stat_unite.type_ordre="deplacement";
                var position_base={
                    lat:player.liste_base[player.liste_base.length-1].lat,
                    lng:player.liste_base[player.liste_base.length-1].lng
                }
                if (position_base==null){
                    console.log("position base nulle")
                }else{
                    unite.stat_unite.ordre_position=position_base;
                }
            }else{
                liste_unite_joueur=listeUnitesPresentes.filter(u=>u.stat_unite.faction==player);
                console.lo
                if(liste_unite_joueur.length!=0){
                    console.log(liste_unite_joueur[0])
                    faireAttaquer(unite,liste_unite_joueur[0]);
                }
            }
            
        }
    })
}

function trouver_bug(){
    listeUnitesPresentes.forEach(unite=>{
        if(unite.stat_unite.type=="unit"){
            console.log(unite.stat_unite.faction.name+"\n"+unite.stat_unite.ordre_position+"\n"+unite.stat_unite.type_ordre);
        }
    })
}

base_joueur=creerBatiment({lat:45.84,lng:4.78},base,player)
base_enemie=creerBatiment({lat:45.849,lng:4.790},base,ennemy)
boucle_du_jeu();
