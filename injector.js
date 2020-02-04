var rootVarId; //Global parent

var myAppJavaScript = function($){
	var _wr = function(type) {
	    var orig = history[type];
	    return function() {
	        var rv = orig.apply(this, arguments);
	        var e = new Event(type);
	        e.arguments = arguments;
	        window.dispatchEvent(e);
	        return rv;
	    };
	};
	history.pushState = _wr('pushState'), history.replaceState = _wr('replaceState');
	window.addEventListener('replaceState', function(e) {
	    const params = new URLSearchParams(window.location.search);
		rootVarId = params.get('variant');
		modifyCartButton();
	});


	$(document).on('change','.addOnOption',function(){
	   modifyCartButton();
	});

	getAddOns();
};



function getAddOns(){
	var tags = [];

	$.getJSON(document.location+".json", function(result){
		tags = result.product.tags.split(", ");

		const params = new URLSearchParams(window.location.search);
		rootVarId = params.get('variant');

		if(rootVarId == undefined){
			rootVarId = result.product.variants[0].id;
		}
		modifyCartButton();

		parseTags(tags, result);
	});

	
}

async function parseTags(tags, result){
	for(var i = 0; i < tags.length; i++){
		if(tags[i].includes("|")){
			var slug = tags[i].split("|")[0];
			var variant_id = tags[i].split("|")[1];
			await getProductDetails(result, slug, variant_id);	
		}
	}
	if(tags.length > 0 && tags[0] != ""){
		document.getElementsByClassName('product-form__item--payment-button')[0].insertAdjacentHTML("afterbegin", '<h2 style="line-height:0.2;">Addons</h2>');
	}
}


function getProductDetails(result, slug, variant_id){
	return new Promise(function (resolve, reject) {
		$.getJSON("https://"+window.location.hostname+"/products/"+slug+".json", function(result){
			var title = result.product.title;
			var image = result.product.image.src;
			var variants = result.product.variants;
			var price = -1;

			if(variants.length > 1){
				for(var i = 0; i < variants.length; i++){
					if(variants[i].id == variant_id){
						price = variants[i].price;
						title += " ("+variants[i].title+")";
					}
				}
			}
			else{
				price = variants[0].price;
			}
			if(price > 0){
				prependOption(title, image, price, variant_id);
			}
			resolve(true);
		});
	});
}


function prependOption(title, image, price, variant_id){

	var html = `
	<label style="border:1px solid #95a5a6;border-radius:4px;padding:6px;display:flex;align-items:center;justify-content: space-between;color: black;cursor: pointer;">
    <div>    
    <img src="`+image+`" height="40" style="vertical-align: middle;border-radius:4px;padding:2px;margin-right:4px;"><h4 class="product-single__title" style="
    display: inline;">`+title+`</h4> 
    </div>
    <div style="vertical-align: middle;color:#69727b;">$`+price+`
    <input type="checkbox" class="addOnOption" value="`+variant_id+`" style="margin-left:2px;">
    </div>
	</label>`

	document.getElementsByClassName('product-form__item--payment-button')[0].insertAdjacentHTML("afterbegin",html);
}

function modifyCartButton(){
	var forms = [];
	$("form").each(function() {
	   forms.push(this);
	});
	var postString = makePostString();

	for(var i = 0; i<forms.length; i++){
		if(forms[i].action.includes("/cart/add")){
			$(forms[i]).attr('action', "/cart/add?id[]="+rootVarId+postString);
		}
	}
	if(postString){
		$(".shopify-payment-button__button").prop("disabled",true);
	}
	else{
		$(".shopify-payment-button__button").prop("disabled",false);
	}
}

function getSelectedAddOns(){
	var variantArray = [];
	$('input.addOnOption:checkbox:checked').each(function () {
	    variantArray.push($(this).val());
	});
	return variantArray;
}

function makePostString(){
	var postString = "";
	var selectedVariants = getSelectedAddOns();
	for(var i = 0; i < selectedVariants.length; i++){
		postString += "&id[]=" + selectedVariants[i];
	}
	return postString;
}

function loadScript(url, callback){
    var script = document.createElement("script")
    script.type = "text/javascript";
    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" ||
                    script.readyState == "complete"){
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function(){
            callback();
        };
    }
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}

//Top Level Code
if(document.location.toString().includes("products")){
	if ((typeof jQuery === 'undefined') || (parseFloat(jQuery.fn.jquery) < 1.7)) {
	  loadScript('//ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js', function(){
	    jQuery191 = jQuery.noConflict(true);
	    myAppJavaScript(jQuery191);
	  });
	} else {
	  myAppJavaScript(jQuery);
	}
}