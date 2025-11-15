package handles

import (
	"strconv"

	"github.com/OpenListTeam/OpenList/v4/internal/conf"
	"github.com/OpenListTeam/OpenList/v4/internal/db"
	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/OpenListTeam/OpenList/v4/internal/op"
	"github.com/OpenListTeam/OpenList/v4/server/common"
	"github.com/gin-gonic/gin"
)

// ImageFavoriteFolder handlers

type CreateImageFavoriteFolderReq struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Order       int    `json:"order"`
}

type UpdateImageFavoriteFolderReq struct {
	ID          uint   `json:"id" binding:"required"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Order       int    `json:"order"`
}

func ListImageFavoriteFolders(c *gin.Context) {
	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() {
		common.ErrorStrResp(c, "permission denied: guest users cannot access favorites", 403)
		return
	}

	folders, err := db.ListImageFavoriteFoldersByUser(user.ID)
	if err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, folders)
}

func GetImageFavoriteFolder(c *gin.Context) {
	idStr := c.Query("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() {
		common.ErrorStrResp(c, "permission denied: guest users cannot access favorites", 403)
		return
	}

	folder, err := db.GetImageFavoriteFolderById(uint(id), user.ID)
	if err != nil {
		common.ErrorResp(c, err, 404)
		return
	}

	common.SuccessResp(c, folder)
}

func CreateImageFavoriteFolder(c *gin.Context) {
	var req CreateImageFavoriteFolderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() || user.Disabled {
		common.ErrorStrResp(c, "permission denied", 403)
		return
	}

	folder := &model.ImageFavoriteFolder{
		UserId:      user.ID,
		Name:        req.Name,
		Description: req.Description,
		Order:       req.Order,
	}

	if err := db.CreateImageFavoriteFolder(folder); err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, folder)
}

func UpdateImageFavoriteFolder(c *gin.Context) {
	var req UpdateImageFavoriteFolderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() || user.Disabled {
		common.ErrorStrResp(c, "permission denied", 403)
		return
	}

	folder, err := db.GetImageFavoriteFolderById(req.ID, user.ID)
	if err != nil {
		common.ErrorResp(c, err, 404)
		return
	}

	folder.Name = req.Name
	folder.Description = req.Description
	folder.Order = req.Order

	if err := db.UpdateImageFavoriteFolder(folder); err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, folder)
}

func DeleteImageFavoriteFolder(c *gin.Context) {
	idStr := c.Query("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() || user.Disabled {
		common.ErrorStrResp(c, "permission denied", 403)
		return
	}

	if err := db.DeleteImageFavoriteFolderById(uint(id), user.ID); err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, "folder deleted successfully")
}

// ImageFavorite handlers

type CreateImageFavoriteReq struct {
	FolderId     uint   `json:"folder_id" binding:"required"`
	StorageId    uint   `json:"storage_id"` // Optional, will be auto-detected from path
	OriginalPath string `json:"original_path" binding:"required"`
	FileName     string `json:"file_name" binding:"required"`
	Note         string `json:"note"`
	Fingerprint  string `json:"fingerprint"`
}

type UpdateImageFavoriteReq struct {
	ID   uint   `json:"id" binding:"required"`
	Note string `json:"note"`
}

func ListImageFavorites(c *gin.Context) {
	idStr := c.Query("id")

	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() {
		common.ErrorStrResp(c, "permission denied: guest users cannot access favorites", 403)
		return
	}

	var favorites []model.ImageFavorite
	var err error

	if idStr == "" || idStr == "0" {
		// List all favorites for user
		favorites, err = db.ListAllImageFavoritesByUser(user.ID)
	} else {
		// List favorites in specific folder
		id, parseErr := strconv.Atoi(idStr)
		if parseErr != nil {
			common.ErrorResp(c, parseErr, 400)
			return
		}
		favorites, err = db.ListImageFavoritesByFolder(uint(id), user.ID)
	}

	if err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, favorites)
}

func CreateImageFavorite(c *gin.Context) {
	var req CreateImageFavoriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() || user.Disabled {
		common.ErrorStrResp(c, "permission denied", 403)
		return
	}

	// Verify folder exists and belongs to user
	_, err := db.GetImageFavoriteFolderById(req.FolderId, user.ID)
	if err != nil {
		common.ErrorStrResp(c, "folder not found or not owned by user", 404)
		return
	}

	// Check if image already exists in this folder
	exists, err := db.CheckImageFavoriteExists(user.ID, req.FolderId, req.OriginalPath)
	if err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}
	if exists {
		common.ErrorStrResp(c, "image already exists in this folder", 400)
		return
	}

	// Auto-detect storage_id from path if not provided
	storageId := req.StorageId
	if storageId == 0 {
		// Try to get storage from path
		reqPath, err := user.JoinPath(req.OriginalPath)
		if err == nil {
			storage, _, err := op.GetStorageAndActualPath(reqPath)
			if err == nil {
				storageId = storage.GetStorage().ID
			}
		}
	}

	favorite := &model.ImageFavorite{
		UserId:       user.ID,
		FolderId:     req.FolderId,
		StorageId:    storageId,
		OriginalPath: req.OriginalPath,
		FileName:     req.FileName,
		Note:         req.Note,
		Fingerprint:  req.Fingerprint,
	}

	if err := db.CreateImageFavorite(favorite); err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, favorite)
}

func UpdateImageFavorite(c *gin.Context) {
	var req UpdateImageFavoriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() || user.Disabled {
		common.ErrorStrResp(c, "permission denied", 403)
		return
	}

	favorite, err := db.GetImageFavoriteById(req.ID, user.ID)
	if err != nil {
		common.ErrorResp(c, err, 404)
		return
	}

	favorite.Note = req.Note

	if err := db.UpdateImageFavorite(favorite); err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, favorite)
}

func DeleteImageFavorite(c *gin.Context) {
	idStr := c.Query("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() || user.Disabled {
		common.ErrorStrResp(c, "permission denied", 403)
		return
	}

	if err := db.DeleteImageFavoriteById(uint(id), user.ID); err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, "image removed from favorites")
}
