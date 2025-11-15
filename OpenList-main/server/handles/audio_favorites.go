package handles

import (
	"strconv"
	"strings"

	"github.com/OpenListTeam/OpenList/v4/internal/conf"
	"github.com/OpenListTeam/OpenList/v4/internal/db"
	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/OpenListTeam/OpenList/v4/internal/op"
	"github.com/OpenListTeam/OpenList/v4/pkg/utils"
	"github.com/OpenListTeam/OpenList/v4/server/common"
	"github.com/gin-gonic/gin"
)

// AudioFavoriteFolder handlers

type CreateAudioFavoriteFolderReq struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Order       int    `json:"order"`
}

type UpdateAudioFavoriteFolderReq struct {
	ID          uint   `json:"id" binding:"required"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Order       int    `json:"order"`
}

func ListAudioFavoriteFolders(c *gin.Context) {
	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() {
		common.ErrorStrResp(c, "permission denied: guest users cannot access favorites", 403)
		return
	}

	folders, err := db.ListAudioFavoriteFoldersByUser(user.ID)
	if err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, folders)
}

func GetAudioFavoriteFolder(c *gin.Context) {
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

	folder, err := db.GetAudioFavoriteFolderById(uint(id), user.ID)
	if err != nil {
		common.ErrorResp(c, err, 404)
		return
	}

	common.SuccessResp(c, folder)
}

func CreateAudioFavoriteFolder(c *gin.Context) {
	var req CreateAudioFavoriteFolderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() || user.Disabled {
		common.ErrorStrResp(c, "permission denied: guest or disabled users cannot create folders", 403)
		return
	}

	folder := &model.AudioFavoriteFolder{
		UserId:      user.ID,
		Name:        req.Name,
		Description: req.Description,
		Order:       req.Order,
	}

	if err := db.CreateAudioFavoriteFolder(folder); err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, folder)
}

func UpdateAudioFavoriteFolder(c *gin.Context) {
	var req UpdateAudioFavoriteFolderReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() || user.Disabled {
		common.ErrorStrResp(c, "permission denied", 403)
		return
	}

	folder, err := db.GetAudioFavoriteFolderById(req.ID, user.ID)
	if err != nil {
		common.ErrorResp(c, err, 404)
		return
	}

	if req.Name != "" {
		folder.Name = req.Name
	}
	folder.Description = req.Description
	folder.Order = req.Order

	if err := db.UpdateAudioFavoriteFolder(folder); err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, folder)
}

func DeleteAudioFavoriteFolder(c *gin.Context) {
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

	if err := db.DeleteAudioFavoriteFolderById(uint(id), user.ID); err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, "folder deleted successfully")
}

// AudioFavorite handlers

type CreateAudioFavoriteReq struct {
	FolderId     uint   `json:"folder_id" binding:"required"`
	StorageId    uint   `json:"storage_id"` // Optional, will be auto-detected from path
	OriginalPath string `json:"original_path" binding:"required"`
	FileName     string `json:"file_name" binding:"required"`
	Note         string `json:"note"`
	Fingerprint  string `json:"fingerprint"`
}

type UpdateAudioFavoriteReq struct {
	ID   uint   `json:"id" binding:"required"`
	Note string `json:"note"`
}

func ListAudioFavorites(c *gin.Context) {
	idStr := c.Query("id")

	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() {
		common.ErrorStrResp(c, "permission denied: guest users cannot access favorites", 403)
		return
	}

	var favorites []model.AudioFavorite
	var err error

	if idStr == "" || idStr == "0" {
		// List all favorites for user
		favorites, err = db.ListAllAudioFavoritesByUser(user.ID)
	} else {
		// List favorites in specific folder
		id, parseErr := strconv.Atoi(idStr)
		if parseErr != nil {
			common.ErrorResp(c, parseErr, 400)
			return
		}
		favorites, err = db.ListAudioFavoritesByFolder(uint(id), user.ID)
	}

	if err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, favorites)
}

func CreateAudioFavorite(c *gin.Context) {
	var req CreateAudioFavoriteReq
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
	_, err := db.GetAudioFavoriteFolderById(req.FolderId, user.ID)
	if err != nil {
		common.ErrorStrResp(c, "folder not found or not owned by user", 404)
		return
	}

	// Check if audio already exists in this folder
	exists, err := db.CheckAudioFavoriteExists(user.ID, req.FolderId, req.OriginalPath)
	if err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}
	if exists {
		common.ErrorStrResp(c, "audio already exists in this folder", 400)
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

	favorite := &model.AudioFavorite{
		UserId:       user.ID,
		FolderId:     req.FolderId,
		StorageId:    storageId,
		OriginalPath: req.OriginalPath,
		FileName:     req.FileName,
		Note:         req.Note,
		Fingerprint:  req.Fingerprint,
	}

	if err := db.CreateAudioFavorite(favorite); err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, favorite)
}

func UpdateAudioFavorite(c *gin.Context) {
	var req UpdateAudioFavoriteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ErrorResp(c, err, 400)
		return
	}

	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() || user.Disabled {
		common.ErrorStrResp(c, "permission denied", 403)
		return
	}

	favorite, err := db.GetAudioFavoriteById(req.ID, user.ID)
	if err != nil {
		common.ErrorResp(c, err, 404)
		return
	}

	favorite.Note = req.Note

	if err := db.UpdateAudioFavorite(favorite); err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, favorite)
}

func DeleteAudioFavorite(c *gin.Context) {
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

	if err := db.DeleteAudioFavoriteById(uint(id), user.ID); err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	common.SuccessResp(c, "audio removed from favorites")
}

// Get all media marks grouped by audio for all favorites
type AudioWithMarksResp struct {
	FolderId     uint                 `json:"folder_id"`
	FolderName   string               `json:"folder_name"`
	AudioId      uint                 `json:"audio_id"`
	FileName     string               `json:"file_name"`
	OriginalPath string               `json:"original_path"`
	StorageId    uint                 `json:"storage_id"`
	Marks        []model.MediaMarkDTO `json:"marks"`
}

func ListAllAudioMarks(c *gin.Context) {
	user := c.Request.Context().Value(conf.UserKey).(*model.User)
	if user.IsGuest() {
		common.ErrorStrResp(c, "permission denied: guest users cannot access favorites", 403)
		return
	}

	// Get all user's media marks
	allMarks, err := db.ListAllMediaMarksByUser(user.ID)
	if err != nil {
		common.ErrorResp(c, err, 500, true)
		return
	}

	// Get all user's favorite audios for additional info
	favorites, _ := db.ListAllAudioFavoritesByUser(user.ID)
	favoriteMap := make(map[string]*model.AudioFavorite)
	for i := range favorites {
		if favorites[i].Fingerprint != "" {
			favoriteMap[favorites[i].Fingerprint] = &favorites[i]
		}
	}

	// Get all folders for folder name mapping
	folders, _ := db.ListAudioFavoriteFoldersByUser(user.ID)
	folderMap := make(map[uint]string)
	for _, folder := range folders {
		folderMap[folder.ID] = folder.Name
	}

	// Group marks by fingerprint (audio)
	marksGrouped := make(map[string][]model.MediaMark)
	for _, mark := range allMarks {
		if mark.Fingerprint == "" {
			continue
		}
		marksGrouped[mark.Fingerprint] = append(marksGrouped[mark.Fingerprint], mark)
	}

	// Build result
	result := []AudioWithMarksResp{}
	for fingerprint, marks := range marksGrouped {
		if len(marks) == 0 {
			continue
		}

		// Filter: only include audio files
		firstMark := marks[0]
		fileType := utils.GetFileType(firstMark.OriginalPath)
		if fileType != conf.AUDIO {
			continue // Skip non-audio files
		}

		// Convert marks to DTOs
		markDTOs := make([]model.MediaMarkDTO, len(marks))
		for i, mark := range marks {
			markDTOs[i] = mark.ToDTO()
		}

		// Try to get info from favorites first
		var resp AudioWithMarksResp
		if fav, exists := favoriteMap[fingerprint]; exists {
			resp = AudioWithMarksResp{
				FolderId:     fav.FolderId,
				FolderName:   folderMap[fav.FolderId],
				AudioId:      fav.ID,
				FileName:     fav.FileName,
				OriginalPath: fav.OriginalPath,
				StorageId:    fav.StorageId,
				Marks:        markDTOs,
			}
		} else {
			// Use info from the first mark
			firstMark := marks[0]

			// Fix old paths that don't include mount path
			originalPath := firstMark.OriginalPath
			if firstMark.StorageId > 0 {
				storage, err := db.GetStorageById(firstMark.StorageId)
				if err == nil && storage.MountPath != "" {
					// Check if path already includes mount path
					if storage.MountPath != "/" && !strings.HasPrefix(originalPath, storage.MountPath) {
						// Path doesn't include mount path, add it
						originalPath = storage.MountPath + "/" + originalPath
					} else if storage.MountPath == "/" && !strings.HasPrefix(originalPath, "/") {
						originalPath = "/" + originalPath
					}
				}
			}

			// Extract filename from path
			fileName := originalPath
			if lastSlash := len(fileName) - 1; lastSlash >= 0 {
				for i := lastSlash; i >= 0; i-- {
					if fileName[i] == '/' {
						fileName = fileName[i+1:]
						break
					}
				}
			}
			resp = AudioWithMarksResp{
				FolderId:     0,
				FolderName:   "未收藏",
				AudioId:      0,
				FileName:     fileName,
				OriginalPath: originalPath,
				StorageId:    firstMark.StorageId,
				Marks:        markDTOs,
			}
		}

		result = append(result, resp)
	}

	common.SuccessResp(c, result)
}
