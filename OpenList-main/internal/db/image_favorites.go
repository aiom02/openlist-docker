package db

import (
	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/pkg/errors"
)

// ImageFavoriteFolder operations

func ListImageFavoriteFoldersByUser(userId uint) ([]model.ImageFavoriteFolder, error) {
	var folders []model.ImageFavoriteFolder
	if err := db.Where("user_id = ?", userId).Order("`order` ASC, created_at DESC").Find(&folders).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to list image favorite folders")
	}
	return folders, nil
}

func GetImageFavoriteFolderById(id uint, userId uint) (*model.ImageFavoriteFolder, error) {
	var folder model.ImageFavoriteFolder
	if err := db.Where("id = ? AND user_id = ?", id, userId).First(&folder).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to get image favorite folder")
	}
	return &folder, nil
}

func CreateImageFavoriteFolder(folder *model.ImageFavoriteFolder) error {
	return errors.WithStack(db.Create(folder).Error)
}

func UpdateImageFavoriteFolder(folder *model.ImageFavoriteFolder) error {
	return errors.WithStack(db.Save(folder).Error)
}

func DeleteImageFavoriteFolderById(id uint, userId uint) error {
	// First delete all images in this folder
	if err := db.Where("folder_id = ? AND user_id = ?", id, userId).Delete(&model.ImageFavorite{}).Error; err != nil {
		return errors.Wrapf(err, "failed to delete images in folder")
	}

	// Then delete the folder
	if err := db.Where("id = ? AND user_id = ?", id, userId).Delete(&model.ImageFavoriteFolder{}).Error; err != nil {
		return errors.Wrapf(err, "failed to delete image favorite folder")
	}

	return nil
}

// ImageFavorite operations

func ListImageFavoritesByFolder(folderId uint, userId uint) ([]model.ImageFavorite, error) {
	var favorites []model.ImageFavorite
	if err := db.Where("folder_id = ? AND user_id = ?", folderId, userId).Order("created_at DESC").Find(&favorites).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to list image favorites")
	}
	return favorites, nil
}

func ListAllImageFavoritesByUser(userId uint) ([]model.ImageFavorite, error) {
	var favorites []model.ImageFavorite
	if err := db.Where("user_id = ?", userId).Order("created_at DESC").Find(&favorites).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to list all image favorites")
	}
	return favorites, nil
}

func GetImageFavoriteById(id uint, userId uint) (*model.ImageFavorite, error) {
	var favorite model.ImageFavorite
	if err := db.Where("id = ? AND user_id = ?", id, userId).First(&favorite).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to get image favorite")
	}
	return &favorite, nil
}

func CheckImageFavoriteExists(userId uint, folderId uint, originalPath string) (bool, error) {
	var count int64
	if err := db.Model(&model.ImageFavorite{}).Where("user_id = ? AND folder_id = ? AND original_path = ?", userId, folderId, originalPath).Count(&count).Error; err != nil {
		return false, errors.Wrapf(err, "failed to check image favorite existence")
	}
	return count > 0, nil
}

func CreateImageFavorite(favorite *model.ImageFavorite) error {
	return errors.WithStack(db.Create(favorite).Error)
}

func UpdateImageFavorite(favorite *model.ImageFavorite) error {
	return errors.WithStack(db.Save(favorite).Error)
}

func DeleteImageFavoriteById(id uint, userId uint) error {
	if err := db.Where("id = ? AND user_id = ?", id, userId).Delete(&model.ImageFavorite{}).Error; err != nil {
		return errors.Wrapf(err, "failed to delete image favorite")
	}
	return nil
}
