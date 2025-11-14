package db

import (
	"github.com/OpenListTeam/OpenList/v4/internal/model"
	"github.com/pkg/errors"
)

func ListMediaMarksByUserAndFingerprint(userId uint, fingerprint string) ([]model.MediaMark, error) {
	var marks []model.MediaMark
	if err := db.Where("user_id = ? AND fingerprint = ?", userId, fingerprint).Order("time_second ASC").Find(&marks).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to list media marks")
	}
	return marks, nil
}

func CreateMediaMark(mark *model.MediaMark) error {
	return errors.WithStack(db.Create(mark).Error)
}

func UpdateMediaMark(mark *model.MediaMark) error {
	return errors.WithStack(db.Save(mark).Error)
}

func GetMediaMarkByIdAndUser(id uint, userId uint) (*model.MediaMark, error) {
	var mark model.MediaMark
	if err := db.Where("id = ? AND user_id = ?", id, userId).First(&mark).Error; err != nil {
		return nil, errors.Wrapf(err, "failed to get media mark")
	}
	return &mark, nil
}

func DeleteMediaMarkByIdAndUser(id uint, userId uint) error {
	result := db.Where("id = ? AND user_id = ?", id, userId).Delete(&model.MediaMark{})
	if result.Error != nil {
		return errors.Wrapf(result.Error, "failed to delete media mark")
	}
	if result.RowsAffected == 0 {
		return errors.New("media mark not found or not owned by user")
	}
	return nil
}
