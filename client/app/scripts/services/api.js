'use strict';

angular.module('latooApp')
	.factory('latooApi', function($http, $cookies) {
		var api = {
			conf : {
				cookie: 'latoo-auth-token',
				//uri: 'http://localhost:9000',
				uri: 'https://api.latoo.fr',
				routes: {
					login: '/auth/local',
                    register: '/users',
                    sendinvites: '/users/sendinvites',
                    deleteinvite: '/users/deleteinvite',
					users: '/users',
                    restorePassword: '/users/forgotPassword', 
                    contactUs: '/users/contactUs', 
					setNewPassword: '/users/setNewPassword', 
					me: '/users/me',
                    company: '/companys',
                    importcompany: '/companys/companysImport',
					companyInfos: '/companyInfos',
					offer: '/offers',
					myPayments: '/payments/me',
					stripeCheckout: '/payments/stripe',
					homeBg: '/admin/homeCover',
					research: '/companys/research',
					dataResearchs: '/dataResearchs',
					pricing: '/admin/activePricing',
					coupon: '/admin/couponInfo'
				},
				admin: {
					routes: {
						manageCompanies: '/manageCompanys',
						searchCompany: '/companys',
                        mails: '/admin/mails',
                        saveTpl: '/admin/saveTpl',
                        getTpl: '/admin/tpl',
                        setActiveTpl: '/admin/setActiveTpl',
						company: '/companys',
						manageUsers: '/users',
						createUsers: '/admin/users',
						searchUsers: '/users',
						metadata: '/admin/stats',
						pricing: '/admin/pricing',
						coupon: '/admin/coupon'
					}
				}
			},
			admin : {},
		};
		api.$getUri = function() {
			return api.conf.uri;
		}
		api.$setProfile = function(user) {
			api.user = user;
		};
		api.$getToken = function() {
			return api.conf.token;
		};
		api.$getProfile = function() {
			return api.user;
		};
		api.$isConnected = function() {
			return (api.conf.isConnected && api.conf.token) || false;
		};
		api.$setSession = function(token) {
			api.conf.isConnected = true;
			api.conf.token = token;
			$cookies.put(api.conf.cookie, token, {exprires: 24 * 60 * 60 * 10})
		};
		api.$logout = function() {
			api.conf.isConnected = false;
			api.conf.token = undefined;
			api.user = undefined;
			$cookies.remove(api.conf.cookie);
		};
		api.$checkSession = function() {
			if (api.conf.isConnected) {
				return true;
			}
			var token = $cookies.get(api.conf.cookie);
			if (token) {
				api.$setSession(token);
				return true;
			};
			return false;
		};
		api.sendRequest = function(type, route, params) {
			return $http({
				method: type,
				url: api.conf.uri + route,
				data: params,
				headers: {
					Authorization: 'Bearer ' + api.conf.token,
				}
			});
		};

        api.sendinvites = function(emails) {
			return api.sendRequest('POST', api.conf.routes.sendinvites, {emails: emails});
        };
        api.deleteInvite = function(email, userid) {
			return api.sendRequest('PUT', api.conf.routes.deleteinvite, {email: email, userid: userid});
        };
        
		api.stripeCheckout = function(token, offer) {
			return api.sendRequest('POST', api.conf.routes.stripeCheckout, {token: token, offer: offer});
		};
		api.getHomeBg = function() {
			return api.sendRequest('GET', api.conf.routes.homeBg);
		};
		api.getMe = function() {
			return api.sendRequest('GET', api.conf.routes.me);
		};
		api.updateMe = function(params) {
			return api.sendRequest('PUT', api.conf.routes.me, params);
		};
		api.changeMyPassword = function(pass) {
			return api.sendRequest('PUT', api.conf.routes.me + '/password', pass);
		};
		api.getUser = function(id) {
			return api.sendRequest('GET', api.conf.routes.users + '/' + id);
		};
		api.getCompanyById = function(id) {
			return api.sendRequest('GET', api.conf.routes.company + '?idCompany=' + id);
		};
		api.getMyCompany = function() {
			return api.sendRequest('GET', api.conf.routes.company + '?idCompany=' + api.user.linkedCompany);
		};
		api.getMySubs = function() {
			return api.sendRequest('GET', api.conf.routes.myPayments);
		};
		api.login = function(email, passwd) {
			return api.sendRequest('POST', api.conf.routes.login, {email: email, password: passwd});
        };
        api.signup = function(datas) {
			return api.sendRequest('POST', api.conf.routes.register, datas);
		};
		api.setNewPassword = function(datas) {
			return api.sendRequest('PUT', api.conf.routes.setNewPassword, datas);
		};
		api.restorePassword = function(datas) {
			return api.sendRequest('POST', api.conf.routes.restorePassword, datas);
        };
        api.contactUs = function(datas) {
			return api.sendRequest('POST', api.conf.routes.contactUs, datas);
		};
		api.createCompany = function(params) {
			return api.sendRequest('POST', api.conf.routes.company, params);
        };
        api.importCompany = function(params) {
			return api.sendRequest('POST', api.conf.routes.importcompany, params);
		};
		api.updateCompany = function(id, params) {
			return api.sendRequest('PUT', api.conf.routes.company + '/' + id, params);
		};
		api.createOffer = function(params) {
			return api.sendRequest('POST', api.conf.routes.offer, params);
		};
		api.updateOffer = function(id, params) {
			return api.sendRequest('PUT', api.conf.routes.offer + '/' + id, params);
		};
		api.deleteOffer = function(id) {
			return api.sendRequest('DELETE', api.conf.routes.offer + '/' + id);
		}
		api.loadOffer = function(id) {
			return api.sendRequest('GET', api.conf.routes.offer + '/' + id);
		}
		api.deleteOfferPic = function(offer, id) {
			return api.sendRequest('DELETE', api.conf.routes.offer + '/' + offer + '/image/' + id);
		}
		api.createCompanyInfos = function(params) {
			return api.sendRequest('POST', api.conf.routes.companyInfos, params);
		};
		api.updateCompanyInfos = function(id, params) {
			return api.sendRequest('PUT', api.conf.routes.companyInfos + '/' + id, params);
		};
		api.deleteCompany = function(id) {
			return api.sendRequest('DELETE', api.conf.routes.company + '/' + id);
		};
		api.loadCompany = function(id) {
			return api.sendRequest('GET', api.conf.routes.company + '/' + id);
		};
		api.attributeCompany = function(id) {
			return api.sendRequest('PUT', api.conf.routes.company + '/' + id + '/attribute');
		};
		api.unlinkCompany = function(id) {
			return api.sendRequest('DELETE', api.conf.routes.company + '/' + id + '/attribute');
		};
		api.searchAPE = function(k) {
			return api.sendRequest('GET', api.conf.routes.dataResearchs + '?keyWord=' + k);
		};
		api.primarySearch = function(k, l, range) {
			return api.sendRequest('GET', api.conf.routes.research + '?keyword=' + k + '&lat=' + l.lat + "&lng=" + l.lng + '&md=' + (range || 3000));
		};
		api.secondarySearch = function(ape, l, range) {
			return api.sendRequest('GET', api.conf.routes.company + '?ape=' + angular.toJson(ape) + '&lat=' + l.lat + "&lng=" + l.lng + '&md=' + (range || 3000));
		};
		api.getPricing = function () {
			return api.sendRequest('GET', api.conf.routes.pricing)
		}

		api.getCouponInfo = function (code) {
			return api.sendRequest('GET', api.conf.routes.coupon + '/' + code)
		}


		api.admin.getCoupons = function () {
			return api.sendRequest('GET', api.conf.admin.routes.coupon)
		}
		api.admin.saveCoupon= function (coupon) {
			return api.sendRequest('PUT', api.conf.admin.routes.coupon, coupon)
		}
		api.admin.delCoupon = function (coupon) {
			return api.sendRequest('DELETE', api.conf.admin.routes.coupon + '/' + coupon)
		}
		api.admin.getPricing = function () {
			return api.sendRequest('GET', api.conf.admin.routes.pricing)
		}
		api.admin.savePricingOffer = function (offer) {
			return api.sendRequest('PUT', api.conf.admin.routes.pricing, offer)
		}
		api.admin.delPricingOffer = function (offer) {
			return api.sendRequest('DELETE', api.conf.admin.routes.pricing + '/' + offer)
		}
		api.admin.sendMail = function(target) {
			return api.sendRequest('POST', api.conf.admin.routes.mails, target);
        };
        api.admin.saveTpl = function(target) {
            console.log(api.conf.admin.routes.saveTpl)
			return api.sendRequest('POST', api.conf.admin.routes.saveTpl, target);
        };
        api.admin.getTpl = function(target) {
            return api.sendRequest('GET', api.conf.admin.routes.getTpl, target);
        };
        api.admin.setActiveTpl = function(target,type) {
            return api.sendRequest('POST', 
            api.conf.admin.routes.setActiveTpl, 
            {tpl: target, type: type});
		};
		api.admin.getMailTarget = function(target) {
			return api.sendRequest('GET', api.conf.admin.routes.mails + '?type=' + target.type + '&delay=' + target.delay);
		};
		api.admin.loadCompanies = function(page, limit) {
			return api.sendRequest('GET', api.conf.admin.routes.manageCompanies + '?offset=' + (limit * (page - 1)) + '&limit=' + limit);
        };
        api.admin.loadCompanies2 = function(page, limit, filterParam, queryKey, queryValue) {
            var query = api.conf.admin.routes.manageCompanies + '?offset=' + (limit * (page - 1)) + '&limit=' + limit + "&filter="+filterParam;

            if(queryKey != undefined){
                query += '&queryKey='+queryKey;

                if(!queryValue)
                    queryValue = '';

                query += '&queryValue='+queryValue;
            }
            
            console.log(query);

            return api.sendRequest('GET', query);
            
		};
		api.admin.deleteCompany = function(id) {
			return api.sendRequest('DELETE', api.conf.admin.routes.company + '/' + id);
		};
		api.admin.searchCompany = function(keyword) {
			return api.sendRequest('GET', api.conf.admin.routes.searchCompany + '?keyword=' + keyword);
		};
		api.admin.createUser = function(param) {
			return api.sendRequest('POST', api.conf.admin.routes.createUsers, param);
		};
		api.admin.deleteUser = function(id) {
			return api.sendRequest('DELETE', api.conf.admin.routes.createUsers + '/' + id);
		};
		api.admin.loadUser = function(id) {
			return api.sendRequest('GET', api.conf.routes.users + '/' + id);
		};
		api.admin.updateUser = function(id, param) {
			return api.sendRequest('PUT', api.conf.admin.routes.createUsers + '/' + id, param);
		};
		api.admin.loadUsers = function(page, limit) {
			return api.sendRequest('GET', api.conf.admin.routes.manageUsers + '?offset=' + (limit * (page - 1)) + '&limit=' + limit);
		};
		api.admin.searchUsers = function(keyword) {
			return api.sendRequest('GET', api.conf.admin.routes.createUsers + '?search=' + keyword);
		};
		api.admin.getMetadata = function() {
			return api.sendRequest('GET', api.conf.admin.routes.metadata);
		};
		return api;
	});