export const getBusinessId = (req)=>{
 return req.session.employerId || req.session.userId
}